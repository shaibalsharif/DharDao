// app/api/auth/[...nextauth]/route.ts

import { handlers } from "@/lib/auth"; // Adjust the path if you put auth.ts in /lib (e.g., @/lib/auth)

export const { GET, POST } = handlers;

// No other code should be in this file!