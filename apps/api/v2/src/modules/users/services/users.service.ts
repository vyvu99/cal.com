import { PrismaReadService } from "@/modules/prisma/prisma-read.service";
import { PrismaWriteService } from "@/modules/prisma/prisma-write.service";
import { UsersRepository, UserWithProfile } from "@/modules/users/users.repository";
import { Injectable } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { randomBytes, createHash } from "crypto";
import { v4 } from "uuid";

import { User } from "@calcom/prisma/client";

// Hash the API key to check against when verifying it. so we don't have to store the key in plain text.
const hashAPIKey = (apiKey: string): string => createHash("sha256").update(apiKey).digest("hex");

// Generate a random API key. Prisma already makes sure it's unique. So no need to add salts like with passwords.
const generateUniqueAPIKey = (apiKey = randomBytes(16).toString("hex")) => [hashAPIKey(apiKey), apiKey];

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
    const existingUser = await this.dbRead.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Check if username is taken (using findFirst since there's no unique constraint just on username)
    const existingUsername = await this.dbRead.prisma.user.findFirst({
      where: { username: username.toLowerCase() },
    });

    if (existingUsername) {
      throw new Error("Username is already taken");
    }

    // Hash the password using bcrypt
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create the user
    const user = await this.dbWrite.prisma.user.create({
      data: {
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        password: { create: { hash: hashedPassword } },
        identityProvider: "CAL", // Use string literal instead of enum
        // Skip email verification
        emailVerified: new Date(Date.now()),
        metadata: {
          // Add any additional metadata for premium users
        },
      },
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

    // Create the API key in the database
    await this.dbWrite.prisma.apiKey.create({
      data: {
        id: v4(),
        userId: userId,
        hashedKey: hashedApiKey,
        note: "API key generated during signup",
        expiresAt: null, // Never expires
      },
    });

    // Return the prefixed API key
    return `${apiKeyPrefix}${apiKey}`;
  }
}
