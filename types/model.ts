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
  isAdmin :string;
  branch_id: string | null;
  created_at: string;
  updated_at: string;
  team : Team;
  branch : Branch;
  creator: Creator | null; // always string from SQL
  is_recurring: boolean;
  frequency?: "Daily" | "Weekly" | "Monthly" | "Yearly";
  interval?: number;
  by_day?: string[];
  until?: string | null;
}

export type Request = {
  id?: string;
  title?: string;
  name?: string;
  date?: string;
  datetime?: string;
  respond_at? : string;
  [key: string]: any;
};

export type Team = {
  requests : string | null;
  team_id : string,
  team_name : string,
  team_description : string,
  joined_at : string,
  team_members?: TeamMember;
}

export type Branch = { 
  branch_id : string;
  team_id : string;
  parent_branch_id : string;
  branch_name: string;
  branch_description : string;
  team : Team
}


export type TeamRequest = {
  request_id : string;
  user_id : string;
  sent_by : string;
  request_type : string;
  status : string;
  added_at : string;
  branch_id : string;
  index: number;
  branch : Branch | null;
  sender : Creator;
}

export type EventMembers = {
  event_id : string;
  user_id : string;
  seen :  boolean
}

export type EventRequest = {
  event_id: string;
  user_id: string;
  status: string;
  respond_at: string;
};

export type TeamMember = {
  team_id : string,
  user_id :  string,
  role : string
}

export type BranchMember = {
  branch_id : string;
  team_id : string,
  user_id :  string,
  role : string,
  joined_at : string,
}


export type SchemaBranch = {
  branch_id : string;
  team_id : string;
  parent_branch_id : string;
  branch_name: string;
  branch_description : string;
  created_by : string;
  created_at : string;
  updated_at : string;
}

export type EventExpense = {
  expense_id: string;
  event_id: string;
  amount: number;
  description: string | null;
  uploaded_by: string;
  uploaded_at: string;
  uploaded_by_user?: Creator | null;
}