import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Brackets, Repository } from "typeorm";
import { User } from "../../entities/user.entity";
import { Follow } from "../../entities/follow.entity";
import { UpdateUserDto } from "./dto/update-user.dto";
import { NotificationsService } from "../notifications/notifications.service";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Follow) private readonly followRepo: Repository<Follow>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async searchUsers(query: string, currentUserId: string, limit = 10) {
    const trimmed = query.trim().replace(/\s+/g, " ");
    if (!trimmed) return [];

    const tokens = trimmed
      .split(" ")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 5);

    const qb = this.userRepo
      .createQueryBuilder("user")
      .select(["user.id", "user.username", "user.displayName", "user.avatarUrl"])
      .where("user.id != :currentUserId", { currentUserId });

    // Pattern matching: support * and ? wildcards and match every token.
    tokens.forEach((token, idx) => {
      const wildcard = token.replace(/\*/g, "%").replace(/\?/g, "_");
      const containsPattern = `%${wildcard}%`;

      qb.andWhere(
        new Brackets((sub) => {
          sub
            .where(`user.username ILIKE :u${idx}`, { [`u${idx}`]: containsPattern })
            .orWhere(`user.displayName ILIKE :d${idx}`, {
              [`d${idx}`]: containsPattern,
            });
        }),
      );
    });

    const firstToken = tokens[0] || trimmed;
    const firstWildcard = firstToken.replace(/\*/g, "%").replace(/\?/g, "_");
    qb
      .addSelect(
        `CASE
          WHEN user.username ILIKE :prefix THEN 0
          WHEN user.displayName ILIKE :prefix THEN 1
          ELSE 2
        END`,
        "rank",
      )
      .setParameter("prefix", `${firstWildcard}%`)
      .orderBy("rank", "ASC")
      .addOrderBy("user.username", "ASC")
      .take(limit);

    const users = await qb.getMany();

    const following = await this.followRepo.find({
      where: { followerId: currentUserId },
      select: ["followingId"],
    });
    const followingSet = new Set(following.map((f) => f.followingId));

    return users.map((u) => ({
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      avatarUrl: u.avatarUrl,
      isFollowing: followingSet.has(u.id),
    }));
  }

  async followUser(currentUserId: string, targetUserId: string) {
    if (currentUserId === targetUserId) {
      throw new BadRequestException("You cannot follow yourself");
    }

    const target = await this.userRepo.findOne({ where: { id: targetUserId } });
    if (!target) {
      throw new NotFoundException("Target user not found");
    }

    const existing = await this.followRepo.findOne({
      where: { followerId: currentUserId, followingId: targetUserId },
    });
    if (existing) {
      return { success: true, alreadyFollowing: true };
    }

    await this.followRepo.save(
      this.followRepo.create({
        followerId: currentUserId,
        followingId: targetUserId,
      }),
    );

    await this.notificationsService.notifyFollow(targetUserId, currentUserId);

    return { success: true, alreadyFollowing: false };
  }

  async unfollowUser(currentUserId: string, targetUserId: string) {
    await this.followRepo.delete({
      followerId: currentUserId,
      followingId: targetUserId,
    });

    return { success: true };
  }

  async findById(id: string) {
    return this.userRepo.findOne({ where: { id } });
  }

  async findByUsername(username: string) {
    const user = await this.userRepo.findOne({
      where: { username },
      select: [
        "id",
        "username",
        "displayName",
        "bio",
        "avatarUrl",
        "createdAt",
        "isOnline",
        "lastSeenAt",
      ],
    });
    if (!user) throw new NotFoundException("User not found");

    const [postCount, followerCount, followingCount] = await Promise.all([
      this.userRepo.manager.count("posts", { where: { authorId: user.id } }),
      this.followRepo.count({ where: { followingId: user.id } }),
      this.followRepo.count({ where: { followerId: user.id } }),
    ]);

    return {
      ...user,
      _count: {
        posts: postCount,
        followers: followerCount,
        following: followingCount,
      },
    };
  }

  async updateProfile(userId: string, updateUserDto: UpdateUserDto) {
    try {
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }
      await this.userRepo.update(userId, updateUserDto);

      return await this.userRepo.findOne({ where: { id: userId } });
    } catch (error: any) {
      console.error("DATABASE ERROR:", error.message);
      throw error;
    }
  }

  async updateAvatar(userId: string, avatarUrl: string) {
    await this.userRepo.update(userId, { avatarUrl: avatarUrl });
    return { avatarUrl };
  }

  async removeAvatar(userId: string) {
    await this.userRepo.update(userId, { avatarUrl: null });
    return { success: true };
  }

  async updateOnlineStatus(userId: string, isOnline: boolean) {
    await this.userRepo.update(userId, {
      isOnline,
      lastSeenAt: isOnline ? null : new Date(),
    });
  }

  async getFollowers(userId: string) {
    return this.followRepo.find({
      where: { followingId: userId },
      relations: ["follower"],
    });
  }

  async getFollowing(userId: string) {
    return this.followRepo.find({
      where: { followerId: userId },
      relations: ["following"],
    });
  }
}
