import type { Belt } from "../../person/constants/person.constants";

export interface StudentSummary {
  personId: string;
  fullName: string;
  code: string;
  belt: Belt;
}
