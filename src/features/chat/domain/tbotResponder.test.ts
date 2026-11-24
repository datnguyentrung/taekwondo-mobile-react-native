import { TBOT_PEER } from "../constants/chat.constants";
import { buildPeerReply } from "./tbotResponder";

describe("buildPeerReply", () => {
  it("answers tuition questions with fee guidance", () => {
    const reply = buildPeerReply("Học phí thế nào?", TBOT_PEER);
    expect(reply).toContain("gói tập");
  });

  it("answers trial class requests", () => {
    const reply = buildPeerReply("Mình muốn đăng ký học thử", TBOT_PEER);
    expect(reply).toContain("học thử miễn phí");
  });

  it("answers age/class recommendations", () => {
    const reply = buildPeerReply("Bé 8 tuổi học lớp nào?", TBOT_PEER);
    expect(reply).toContain("Cơ bản thiếu nhi");
  });

  it("handles image-only messages gracefully", () => {
    const reply = buildPeerReply("", TBOT_PEER, true);
    expect(reply).toContain("hình ảnh");
  });
});
