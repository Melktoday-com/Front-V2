export type PublisherType = 'AGENCY' | 'HOST' | 'PLATFORM';
export type TargetType = 'AGENCY' | 'HOST' | 'PLATFORM';

export interface ShowcaseHeader {
  id: string;
  type: TargetType;
  title: string;
  slug?: string;
  avatarUrl?: string;
  coverUrl?: string;
  rating?: number;
  cityId?: string;
  cityName?: string;
  isVerified: boolean;
  followersCount: number;
  isFollowing?: boolean;
  postsCount: number;
  listingsCount: number;
}

export interface UnifiedPost {
  id: string;
  authorUserId: string;
  publisherType: PublisherType;
  publisherId: string;
  title: string;
  slug?: string;
  summary?: string;
  content: string;
  category?: string;
  mediaUrls: string[];
  isPublished: boolean;
  isFeatured: boolean;
  viewCount: number;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
  hasLiked?: boolean;
  publisher?: {
    id: string;
    name: string;
    slug?: string;
    logoUrl?: string;
    isVerified: boolean;
  };
}

export interface HostAbout {
  bio: string;
  address?: string;
  phone?: string;
  mobile?: string;
  rating?: number;
}

export interface PlatformAbout {
  title: string;
  subtitle: string;
  description: string;
  phone?: string;
  email?: string;
  address?: string;
  socialMedia: {
    website?: string;
    instagram?: string;
    telegram?: string;
    whatsapp?: string;
    youtube?: string;
    aparat?: string;
  };
}

export interface AgencyAbout {
  bio: string;
  licenseNumber?: string;
  guildCode?: string;
  address?: string;
  workingHours?: string;
  phone?: string;
  mobile?: string;
  rating?: number;
  socialMedia: {
    website?: string;
    instagram?: string;
    telegram?: string;
    whatsapp?: string;
  };
}

export interface ShowcaseResponse<TAbout = any> {
  header: ShowcaseHeader;
  about: TAbout;
}
