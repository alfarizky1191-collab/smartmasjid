export type MosquePublic = {
  id: string;
  name: string;
  slug: string;
  city: string;
  province: string;
  address: string;
  logo_url: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type Announcement = {
  id: string;
  title: string;
  is_active: boolean;
  created_at: string;
};

export type Event = {
  id: string;
  title: string;
  speaker: string | null;
  event_date: string;
  event_time: string | null;
  location: string | null;
  description: string | null;
};

export type Officer = {
  id: string;
  name: string;
};

export type OfficerSchedule = {
  id: string;
  schedule_date: string;
  role: string;
  officers: Officer | null;
};

export type QrisSettings = {
  id: string;
  image_url: string | null;
};

export type Donation = {
  id: string;
  donor_name: string | null;
  amount: number;
  created_at: string;
};

export type Slide = {
  id: string;
  image_url: string;
};
