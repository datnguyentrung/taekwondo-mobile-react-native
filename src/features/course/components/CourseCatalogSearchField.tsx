import { FormField } from "@/features/student-commerce/components/StudentCommercePrimitives";
import type { CourseCatalogTab } from "@/features/student-commerce/types";

import { getCourseSearchPlaceholder } from "../utils/courseCatalogViewModel";

export function CourseCatalogSearchField({ tab }: { tab: CourseCatalogTab }) {
  return (
    <FormField
      label="Tìm kiếm"
      value={getCourseSearchPlaceholder(tab)}
      editable={false}
    />
  );
}
