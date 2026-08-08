export interface Settings {
  site_name: string;
  tagline: string;
  hero_name: string;
  hero_title: string;
  hero_bio: string;
  hero_photo: string;
  about_bio: string;
  social_twitter: string;
  social_github: string;
  social_linkedin: string;
  social_instagram: string;
  contact_email: string;
  contact_whatsapp: string;
  telegram_chat_id: string;
  og_image: string;
  marketplace_listing_fee: string;
  telegram_daily_report: string;
  telegram_weekly_digest: string;
  telegram_expiring_ads: string;
}

export interface Project {
  id: number;
  title: string;
  slug: string;
  description: string;
  stack: string;
  image_url: string;
  gallery_images: string;
  live_url: string;
  repo_url: string;
  featured: boolean;
  order_index: number;
  created_at: string;
}

export interface EducationItem {
  id: number;
  institution: string;
  program: string;
  start_date: string;
  end_date: string;
  description: string;
  order_index: number;
  type: string;
}

export interface RoleItem {
  id: number;
  title: string;
  org: string;
  start_date: string;
  end_date: string;
  description: string;
  order_index: number;
}

export interface Course {
  id: number;
  title: string;
  description: string;
  link: string;
  price: string;
  is_own_product: boolean;
  image_url: string;
  order_index: number;
}

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string;
  tags: string;
  status: string;
  publish_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Listing {
  id: number;
  title: string;
  description: string;
  price: string;
  image_url: string;
  category: string;
  link: string;
  is_own: boolean;
  owner_name: string;
  owner_contact: string;
  listing_fee: string;
  fee_paid: boolean;
  paystack_ref: string;
  status: string;
  delivery_type: string;
  file_id: string | null;
  created_at: string;
}

export interface AdSlot {
  id: number;
  name: string;
  position: string;
  price_per_day: string;
  max_active: number;
  description: string;
  is_active: boolean;
}

export interface AdSubmission {
  id: number;
  slot_id: number | null;
  package_id: number | null;
  mediums: string;
  advertiser_name: string;
  contact: string;
  image_url: string;
  target_url: string;
  duration_days: number;
  start_date: string;
  end_date: string;
  amount_paid: string;
  paystack_ref: string;
  status: string;
  created_at: string;
}

export interface Message {
  id: number;
  name: string;
  email: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface AdminUser {
  id: number;
  email: string | null;
  username: string | null;
  role: string;
}

export interface Ad {
  id: number;
  image_url: string;
  target_url: string;
  position: string;
}

export interface SocialAccount {
  id: number;
  platform: string;
  url: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
}

export interface AdPackage {
  id: number;
  name: string;
  mediums: string;
  daily_rate: string;
  bundle_3_rate: string;
  description: string;
  is_active: boolean;
}
