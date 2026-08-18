import React, { Suspense } from "react";
import ResetPasswordClient from "./reset-client";

export default function Page() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <ResetPasswordClient />
    </Suspense>
  );
}