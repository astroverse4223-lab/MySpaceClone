export { auth as proxy } from "@/auth";

export const config = {
  matcher: ["/profile/edit/:path*", "/settings/:path*", "/friends/:path*", "/feed/:path*", "/messages/:path*"],
};
