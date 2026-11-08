import type { CheckInErrorType, CheckInFailure } from "../types/faceScanner.types";
import { failureFromBackend, networkFailure } from "../services/faceCheckInApi";
import { getCheckInResultPresentation } from "./checkInResultPresentation";

function failure(errorType: CheckInErrorType): CheckInFailure {
  return {
    errorType,
    title: `Title ${errorType}`,
    message: `Message ${errorType}`,
    ctaLabel: "Tiếp tục",
  };
}

describe("getCheckInResultPresentation", () => {
  it.each([
    ["NO_ACTIVE_SESSION", "G02"],
    ["AMBIGUOUS_CONTEXT", "G02"],
    ["UNSUPPORTED_CONTEXT", "G02"],
    ["ATTENDANCE_CLOSED", "G02"],
    ["ALREADY_CHECKED_IN", "G03"],
    ["ALREADY_CHECKED_OUT", "G03"],
    ["PERSON_NOT_FOUND", "G04"],
    ["NO_FACE", "G05"],
    ["MULTIPLE_FACES", "G05"],
    ["INVALID_IMAGE", "G05"],
    ["EXPIRED", "G06"],
    ["SERVICE_UNAVAILABLE", "G07"],
    ["NETWORK_ERROR", "G07"],
    ["UNKNOWN", "G07"],
    ["ACCESS_DENIED", "G08"],
  ] as const)("maps %s to %s", (errorType, expectedGroup) => {
    expect(getCheckInResultPresentation(null, failure(errorType)).artworkGroup).toBe(
      expectedGroup,
    );
  });

  it("uses G01 for successful results", () => {
    expect(getCheckInResultPresentation(null, null).artworkGroup).toBe("G01");
  });

  it.each([
    ["FACE_CHECK_IN_NO_ACTIVE_CONTEXT", "G02"],
    ["FACE_CHECK_IN_AMBIGUOUS_CONTEXT", "G02"],
    ["FACE_CHECK_IN_UNSUPPORTED_CONTEXT", "G02"],
    ["FACE_CHECK_IN_PERSON_TYPE_INVALID", "G02"],
    ["ATTENDANCE_CLOSED", "G02"],
    ["ATTENDANCE_ALREADY_CLOSED", "G02"],
    ["FACE_CHECK_IN_ALREADY_CHECKED_IN", "G03"],
    ["FACE_CHECK_IN_ALREADY_CHECKED_OUT", "G03"],
    ["FACE_NOT_MATCHED", "G04"],
    ["PERSON_NOT_FOUND", "G04"],
    ["FACE_NOT_DETECTED", "G05"],
    ["MULTIPLE_FACES_DETECTED", "G05"],
    ["INVALID_IMAGE_FILE", "G05"],
    ["EMPTY_IMAGE_FILE", "G05"],
    ["FILE_TOO_LARGE", "G05"],
    ["UNSUPPORTED_IMAGE_TYPE", "G05"],
    ["IMAGE_DECODE_FAILED", "G05"],
    ["FACE_CHECK_IN_EXPIRED", "G06"],
    ["EXPIRED", "G06"],
    ["MODEL_NOT_INITIALIZED", "G07"],
    ["PYTHON_BACKEND_UNAVAILABLE", "G07"],
    ["PYTHON_BACKEND_ERROR", "G07"],
    ["UNMAPPED_ERROR", "G07"],
    ["ACCESS_DENIED", "G08"],
    ["UNAUTHORIZED", "G08"],
  ] as const)("maps backend code %s to %s", (code, expectedGroup) => {
    const mappedFailure = failureFromBackend(undefined, { code });
    expect(getCheckInResultPresentation(null, mappedFailure).artworkGroup).toBe(
      expectedGroup,
    );
  });

  it("uses G07 for network failures and G08 for HTTP authorization failures", () => {
    expect(getCheckInResultPresentation(null, networkFailure()).artworkGroup).toBe(
      "G07",
    );
    expect(
      getCheckInResultPresentation(null, failureFromBackend(401, {})).artworkGroup,
    ).toBe("G08");
    expect(
      getCheckInResultPresentation(null, failureFromBackend(403, {})).artworkGroup,
    ).toBe("G08");
  });
});
