import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Profile } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PreferencesDto } from './dto/preferences.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UserFilterDto } from './dto/user-filter.dto';
import { PaginatedResult } from './interfaces/paginated-result.interface';
import {
  DEFAULT_PREFERENCES,
  Preferences,
} from './interfaces/preferences.interface';
import { ProfileResponse } from './interfaces/profile-response.interface';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<ProfileResponse> {
    const profile = await this.getProfileOrThrow(id);

    return this.toProfileResponse(profile);
  }

  async updateProfile(
    id: string,
    dto: UpdateProfileDto,
  ): Promise<ProfileResponse> {
    const profile = await this.getProfileOrThrow(id);
    const preferences = this.mergePreferences(
      profile.preferences,
      dto.preferences,
    );

    const updated = await this.prisma.profile.update({
      where: { id },
      data: {
        name: dto.name,
        avatarUrl: dto.avatarUrl,
        preferences: preferences as unknown as Prisma.InputJsonValue,
      },
    });

    return this.toProfileResponse(updated);
  }

  async findAll(
    filter: UserFilterDto,
  ): Promise<PaginatedResult<ProfileResponse>> {
    const { page = 1, limit = 20 } = filter;

    const [profiles, total] = await this.prisma.$transaction([
      this.prisma.profile.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.profile.count(),
    ]);

    return {
      data: profiles.map((profile) => this.toProfileResponse(profile)),
      meta: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  async updateRole(id: string, dto: UpdateRoleDto): Promise<ProfileResponse> {
    await this.getProfileOrThrow(id);

    const updated = await this.prisma.profile.update({
      where: { id },
      data: { role: dto.role },
    });

    return this.toProfileResponse(updated);
  }

  private async getProfileOrThrow(id: string): Promise<Profile> {
    const profile = await this.prisma.profile.findUnique({ where: { id } });

    if (!profile) {
      throw new NotFoundException(`User "${id}" not found.`);
    }

    return profile;
  }

  // Deep-merges the partial DTO into the currently stored preferences
  // (falling back to DEFAULT_PREFERENCES for legacy/null rows), so clients
  // only need to send the fields they actually want to change.
  private mergePreferences(
    current: Prisma.JsonValue | null,
    updates?: PreferencesDto,
  ): Preferences {
    const base = this.parsePreferences(current);

    if (!updates) {
      return base;
    }

    return {
      theme: updates.theme ?? base.theme,
      accessibility: {
        highContrast:
          updates.accessibility?.highContrast ??
          base.accessibility.highContrast,
        fontSizeMultiplier:
          updates.accessibility?.fontSizeMultiplier ??
          base.accessibility.fontSizeMultiplier,
      },
      localization: {
        dateFormat:
          updates.localization?.dateFormat ?? base.localization.dateFormat,
      },
    };
  }

  private parsePreferences(value: Prisma.JsonValue | null): Preferences {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return DEFAULT_PREFERENCES;
    }

    const raw = value as Record<string, unknown>;
    const accessibility = (raw.accessibility ?? {}) as Record<string, unknown>;
    const localization = (raw.localization ?? {}) as Record<string, unknown>;

    return {
      theme: (raw.theme as Preferences['theme']) ?? DEFAULT_PREFERENCES.theme,
      accessibility: {
        highContrast:
          (accessibility.highContrast as boolean) ??
          DEFAULT_PREFERENCES.accessibility.highContrast,
        fontSizeMultiplier:
          (accessibility.fontSizeMultiplier as number) ??
          DEFAULT_PREFERENCES.accessibility.fontSizeMultiplier,
      },
      localization: {
        dateFormat:
          (localization.dateFormat as string) ??
          DEFAULT_PREFERENCES.localization.dateFormat,
      },
    };
  }

  private toProfileResponse(profile: Profile): ProfileResponse {
    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      avatarUrl: profile.avatarUrl,
      role: profile.role,
      preferences: this.parsePreferences(profile.preferences),
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }
}
