export type Creator = {
  user_id: string;
  name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  country: string;
  is_private: boolean;
  availability_day_of_week: string | null;
  availability_start_time: string | null;
  availability_end_time: string | null;
  password: string;
  timezone: string;
  created_at: string;
  updated_at: string;
  status: string;
}

export type Event = {
  event_id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  category: string;
  state: string;
  location: string;
  created_by: string;
  team_id: string | null;
  branch_id: string | null;
  created_at: string;
  updated_at: string;
  creator: Creator;
}

export type Request = {
  id?: string;
  title?: string;
  name?: string;
  date?: string;
  datetime?: string;
  [key: string]: any;
};