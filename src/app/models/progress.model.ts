export interface DailyProgress {
  day: number;
  diet: boolean;
  workoutOutside: boolean;
  workoutAnywhere: boolean;
  water: boolean;
  reading: boolean;
  progressPic: boolean;
  photoUrl?: string;
}

export interface WeekProgress {
  weekNumber: number;
  days: DailyProgress[];
}
