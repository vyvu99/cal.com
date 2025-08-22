import { sha256Hash } from "@/lib/api-key";
import { PlatformPlan } from "@/modules/billing/types";
import { PrismaReadService } from "@/modules/prisma/prisma-read.service";
import { PrismaWriteService } from "@/modules/prisma/prisma-write.service";
import { UsersRepository, UserWithProfile } from "@/modules/users/users.repository";
import { Injectable } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { randomBytes } from "crypto";
import { v4 } from "uuid";
import { CreationSource, IdentityProvider, User } from "@calcom/prisma/client";

// Generate a random API key. Prisma already makes sure it's unique. So no need to add salts like with passwords.
const generateUniqueAPIKey = (apiKey = randomBytes(16).toString("hex")) => [sha256Hash(apiKey), apiKey];

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly dbRead: PrismaReadService,
    private readonly dbWrite: PrismaWriteService
  ) {}

  async getByUsernames(usernames: string[], orgSlug?: string, orgId?: number) {
    const users = await Promise.all(
      usernames.map((username) => this.usersRepository.findByUsername(username, orgSlug, orgId))
    );
    const usersFiltered: User[] = [];

    for (const user of users) {
      if (user) {
        usersFiltered.push(user);
      }
    }

    return users;
  }

  getUserMainProfile(user: UserWithProfile) {
    return (
      user?.movedToProfile ||
      user.profiles?.find((p) => p.organizationId === user.organizationId) ||
      user.profiles?.[0]
    );
  }

  getUserMainOrgId(user: UserWithProfile) {
    return this.getUserMainProfile(user)?.organizationId ?? user.organizationId;
  }

  getUserProfileByOrgId(user: UserWithProfile, organizationId: number) {
    return user.profiles?.find((p) => p.organizationId === organizationId);
  }

  /**
   * Creates a new user account with premium plan and skips email verification
   * @param userData The user data to create the account with
   * @returns The created user object
   */
  async createPremiumUserAccount(userData: {
    username: string;
    email: string;
    password: string;
  }): Promise<User> {
    const { username, email, password } = userData;

    // Check if user already exists
    const existingUser = await this.dbRead.prisma.user.findFirst({
      where: { OR: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }] },
    });

    if (existingUser) {
      return existingUser;
    }

    // Hash the password using bcrypt
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user and organization in a transaction
    const user = await this.dbWrite.prisma.$transaction(async (prisma) => {
      // Create the user
      const newUser = await prisma.user.create({
        data: {
          username: username.toLowerCase(),
          email: email.toLowerCase(),
          role: "ADMIN",
          name: username,
          locale: "vi",
          identityProvider: IdentityProvider.CAL,
          emailVerified: new Date(Date.now()),
          creationSource: CreationSource.WEBAPP,
          metadata: {},
          password: { create: { hash: hashedPassword } },
        },
      });

      // Create an organization for the user
      // First check if slug is already taken and generate a unique one if needed
      let slug = username.toLowerCase();
      const slugExists = await prisma.team.findFirst({
        where: { slug },
      });

      if (slugExists) {
        // Generate a unique slug by appending a random string
        slug = `${username.toLowerCase()}-${randomBytes(3).toString("hex")}`;
      }

      const org = await prisma.team.create({
        data: {
          name: `${username}'s Organization`,
          slug,
          isOrganization: true,
          isPlatform: true,
          organizationSettings: {
            create: {
              isOrganizationVerified: false,
              orgAutoAcceptEmail: "",
              isAdminAPIEnabled: true,
              isAdminReviewed: false,
            },
          },
        },
      });

      // Create membership linking user to organization
      await prisma.membership.create({
        data: {
          userId: newUser.id,
          teamId: org.id,
          role: "OWNER",
          accepted: true,
        },
      });

      // Create profile for the user in the organization
      const profile = await prisma.profile.create({
        data: {
          uid: v4(),
          username: username.toLowerCase(),
          organizationId: org.id,
          userId: newUser.id,
        },
      });

      // Update user with movedToProfileId
      await prisma.user.update({
        where: { id: newUser.id },
        data: {
          movedToProfileId: profile.id,
          organizationId: org.id,
        },
      });

      // Add platform billing pro to the organization with subscription ID
      await prisma.team.update({
        where: { id: org.id },
        data: {
          platformBilling: {
            create: {
              customerId: `cust_${v4()}`, // Generate a dummy customer ID
              plan: PlatformPlan.SCALE.toString(),
              subscriptionId: `sub_${v4()}`, // Generate a dummy subscription ID
            },
          },
        },
      });

      return newUser;
    });

    return user;
  }

  /**
   * Generates an API key for a user
   * @param userId The ID of the user to generate an API key for
   * @returns The generated API key
   */
  async generateApiKeyForUser(userId: number): Promise<string> {
    // Generate a unique API key
    const [hashedApiKey, apiKey] = generateUniqueAPIKey();

    // Get the API key prefix from environment variables or use default
    const apiKeyPrefix = process.env.API_KEY_PREFIX ?? "cal_";

    // Delete apiKeys
    await this.dbWrite.prisma.apiKey.deleteMany({
      where: {
        userId: userId,
      },
    });

    const user = await this.dbWrite.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        organizationId: true,
      },
    });

    // Create the API key in the database
    await this.dbWrite.prisma.apiKey.create({
      data: {
        id: v4(),
        userId: userId,
        hashedKey: hashedApiKey,
        note: "API key generated during signup",
        expiresAt: null, // Never expires
        teamId: user?.organizationId,
      },
    });

    // Return the prefixed API key
    return `${apiKeyPrefix}${apiKey}`;
  }
}
