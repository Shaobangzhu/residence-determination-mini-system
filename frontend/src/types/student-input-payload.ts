export type StudentInputPayload = {
  age: number;
  monthsInCA: number;
  hasCADriverLicense: boolean;
  registeredToVoteInCA: boolean;
  filesCATaxes: boolean;
};

export const initialForm: StudentInputPayload = {
  age: 18,
  monthsInCA: 0,
  hasCADriverLicense: false,
  registeredToVoteInCA: false,
  filesCATaxes: false,
};
