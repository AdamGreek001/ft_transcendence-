import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../../entities/user.entity";
import { Follow } from "../../entities/follow.entity";
import { UpdateUserDto } from "./dto/update-user.dto";
import { error } from "console";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Follow) private readonly followRepo: Repository<Follow>,
  ) {}

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
