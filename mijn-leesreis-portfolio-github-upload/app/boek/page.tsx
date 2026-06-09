import { Suspense } from "react";
import { AppView } from "@/components/app-view";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AppView view="book-detail" />
    </Suspense>
  );
}
