export type Mosque = {
  id: string;
  name: string;
  slug: string;
  city: string;
  province: string;
  address?: string;       // optional — not fetched on public directory
  logo_url: string | null;
  verified?: boolean;     // optional — column may not exist yet
};
