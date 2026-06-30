import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What information MySpace Reborn collects and how it's used.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-semibold">Privacy Policy</h1>
      <p className="mt-2 text-sm text-white/50">Last updated June 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-white/70">
        <section>
          <h2 className="text-base font-medium text-white">1. Overview</h2>
          <p className="mt-2">
            This policy explains what information MySpace Reborn (the &quot;Service&quot;) collects, how we use
            it, who we share it with, and the choices you have. By using the Service, you agree to the
            practices described here.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-white">2. Information we collect</h2>

          <p className="mt-3 font-medium text-white/90">Account information</p>
          <p className="mt-1">
            Email address, username, display name, and a securely hashed password (we never store your
            password in plain text). If you enable two-factor authentication, we store a TOTP secret used to
            verify your authentication codes.
          </p>

          <p className="mt-3 font-medium text-white/90">Profile information</p>
          <p className="mt-1">
            Anything you choose to add to your profile: bio, location, interests, links, mood, headline,
            favorite artists, avatar/cover/background images, profile song, and visual customization (theme,
            colors, fonts, cursor effects).
          </p>

          <p className="mt-3 font-medium text-white/90">Content you create</p>
          <p className="mt-1">
            Posts, comments, reactions, reposts, bookmarks, stories, reels, direct and group messages, blog
            articles, playlists, marketplace listings, guestbook entries, community posts, and event RSVPs.
            Messages are delivered in real time and stored so conversation history is available when you sign
            back in.
          </p>

          <p className="mt-3 font-medium text-white/90">Usage &amp; device data</p>
          <p className="mt-1">
            Login timestamps, IP address, and user agent for each sign-in attempt (used for account security and
            abuse prevention). We also track profile page views, and we use your IP address transiently to
            apply rate limits on sensitive actions (registration, login, file uploads) — these rate-limit
            counters are kept in memory and not persisted long-term.
          </p>

          <p className="mt-3 font-medium text-white/90">Payment information</p>
          <p className="mt-1">
            Donations, creator membership subscriptions, and tips are processed by Stripe. We never see or
            store your full card number — Stripe handles that. We do store transaction metadata relevant to
            your account, such as the amount, status, and subscription period.
          </p>

          <p className="mt-3 font-medium text-white/90">Push notifications</p>
          <p className="mt-1">
            If you opt in to browser push notifications, we store the subscription endpoint and encryption keys
            your browser provides, so we can deliver notifications to your device. You can revoke this anytime
            through your browser or device settings.
          </p>

          <p className="mt-3 font-medium text-white/90">Cookies &amp; similar technology</p>
          <p className="mt-1">
            We use a session cookie to keep you signed in. If analytics are enabled, Google Analytics may set
            cookies to measure site usage (see Section 4).
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-white">3. How we use information</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>To provide and operate the Service — your feed, profile, messaging, communities, and other features.</li>
            <li>To authenticate you and keep your account secure (login verification, 2FA, abuse/rate-limit prevention).</li>
            <li>To send transactional email — email verification, password reset, and optional notification digests (you can turn the digest off in Settings).</li>
            <li>To process payments you initiate (donations, tips, memberships).</li>
            <li>To moderate content, respond to reports, and enforce our Terms of Service and Copyright/DMCA Policy.</li>
            <li>To understand aggregate usage and improve the Service, where analytics are enabled.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-medium text-white">4. How we share information</h2>
          <p className="mt-2">We don&apos;t sell your personal information. We share it only with:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li><span className="text-white/90">Other users</span>, according to your own visibility choices — e.g., your public profile, posts, and anything you send in a conversation are visible to the people you share them with.</li>
            <li><span className="text-white/90">Stripe</span>, to process donations, tips, and subscription payments.</li>
            <li><span className="text-white/90">Our email provider</span>, to deliver verification, password reset, and digest emails.</li>
            <li><span className="text-white/90">Cloudflare R2</span>, to store uploaded images, audio, and video.</li>
            <li><span className="text-white/90">Giphy</span>, when you search for a GIF in the post composer (your search term is sent to Giphy&apos;s API).</li>
            <li><span className="text-white/90">Google Analytics</span>, if enabled, to measure aggregate site usage.</li>
            <li><span className="text-white/90">Law enforcement or other parties</span>, where required by law, to protect our rights, or to prevent harm.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-medium text-white">5. Data retention</h2>
          <p className="mt-2">
            We keep your account and content for as long as your account is active. If you request account
            deletion, we delete or anonymize your personal information within a reasonable time, except where
            we need to retain it to comply with law, resolve disputes, or enforce our agreements (for example,
            payment records required for tax/accounting purposes).
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-white">6. Your choices &amp; rights</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Edit or delete most of your profile and content directly within the Service.</li>
            <li>Turn off email digest notifications in Settings.</li>
            <li>Revoke push notification permission through your browser/device.</li>
            <li>Request a copy of your data, or request account deletion, by emailing us (Section 9).</li>
            <li>
              Depending on where you live (for example, under the GDPR in the EU/UK or the CCPA in California),
              you may have additional rights to access, correct, delete, or restrict processing of your
              personal information, and to object to certain uses. Contact us to exercise these rights.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-medium text-white">7. Children&apos;s privacy</h2>
          <p className="mt-2">
            The Service is not directed at children under 13, and we don&apos;t knowingly collect personal
            information from anyone under 13. If you believe a child under 13 has created an account, contact
            us and we&apos;ll take steps to delete it.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-white">8. Security</h2>
          <p className="mt-2">
            Passwords are hashed with bcrypt, never stored in plain text. We support optional two-factor
            authentication (TOTP), apply rate limits to sensitive endpoints, and set standard security headers
            on every response. No method of transmission or storage is 100% secure, so we can&apos;t guarantee
            absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-white">9. Contact</h2>
          <p className="mt-2">
            Questions about this policy, or requests to access/delete your data? Email{" "}
            <a href="mailto:countryboya20@gmail.com" className="text-violet-400 hover:underline">
              countryboya20@gmail.com
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-white">10. Changes to this policy</h2>
          <p className="mt-2">
            We may update this Privacy Policy from time to time. We&apos;ll update the &quot;Last updated&quot;
            date above when we do, and highlight material changes on the Service.
          </p>
        </section>
      </div>
    </div>
  );
}
