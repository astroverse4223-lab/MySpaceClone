import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of MySpace Reborn.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-semibold">Terms of Service</h1>
      <p className="mt-2 text-sm text-white/50">Last updated June 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-white/70">
        <section>
          <h2 className="text-base font-medium text-white">1. Acceptance of these terms</h2>
          <p className="mt-2">
            By creating an account or otherwise using MySpace Reborn (the &quot;Service&quot;), you agree to
            these Terms of Service (&quot;Terms&quot;). If you don&apos;t agree to them, don&apos;t use the
            Service. We may update these Terms from time to time as described in Section 17; continuing to use
            the Service after an update means you accept the revised Terms.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-white">2. Eligibility</h2>
          <p className="mt-2">
            You must be at least 13 years old to use the Service. If you are under the age of majority in your
            jurisdiction, you may only use the Service with the involvement and consent of a parent or
            guardian. By using the Service you represent that you meet these requirements and that everything
            you tell us about yourself (email, name, date of birth where applicable) is accurate.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-white">3. Your account</h2>
          <p className="mt-2">
            You&apos;re responsible for the security of your account, including keeping your password
            confidential and enabling two-factor authentication if you want extra protection. You&apos;re
            responsible for all activity that happens under your account. Notify us immediately if you suspect
            unauthorized access. One account per person; don&apos;t create accounts to evade a suspension or
            impersonate someone else.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-white">4. Your content</h2>
          <p className="mt-2">
            You own the content you post — posts, comments, photos, videos, audio, blog articles, playlists,
            marketplace listings, messages, and anything else you upload (&quot;User Content&quot;). By posting
            User Content, you grant us a non-exclusive, worldwide, royalty-free license to host, store,
            reproduce, display, and distribute it solely for the purpose of operating and improving the
            Service (for example, showing your post in friends&apos; feeds, or playing your profile song on
            your page). This license ends when you delete the content or your account, except where it has
            already been shared with others or retained as required by law.
          </p>
          <p className="mt-2">
            You&apos;re solely responsible for your User Content and must have the rights to post it. Don&apos;t
            upload copyrighted material (music, images, video, text) you don&apos;t own or aren&apos;t licensed
            to use — see our{" "}
            <a href="/dmca" className="text-violet-400 hover:underline">
              Copyright / DMCA Policy
            </a>{" "}
            for how we handle infringement claims.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-white">5. Prohibited conduct</h2>
          <p className="mt-2">You agree not to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Post content that is illegal, harassing, hateful, threatening, or sexually exploitative of minors.</li>
            <li>Infringe anyone&apos;s copyright, trademark, privacy, or other rights.</li>
            <li>Impersonate any person or entity, or misrepresent your affiliation with one.</li>
            <li>Send spam, run scams, or use the Service to distribute malware.</li>
            <li>Scrape, crawl, or harvest data from the Service beyond normal use, or attempt to bypass rate limits or security controls.</li>
            <li>Use automated means (bots, scripts) to create accounts or generate engagement.</li>
            <li>Interfere with or disrupt the Service&apos;s infrastructure (including the real-time messaging and push notification systems).</li>
            <li>Use the Service for any purpose that violates applicable law.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-medium text-white">6. Moderation &amp; enforcement</h2>
          <p className="mt-2">
            We may remove content, suspend, or terminate accounts that violate these Terms, at our discretion
            and without prior notice, including through automated tools, user reports, or DMCA takedown
            notices. We&apos;re not obligated to monitor all content, but we may review reported content and
            take action we judge appropriate.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-white">7. Payments, subscriptions, tips &amp; donations</h2>
          <p className="mt-2">
            Donations, creator membership subscriptions, and tips are processed by Stripe. We don&apos;t store
            your full card details. Subscriptions automatically renew at the interval you chose (monthly or
            yearly) until you cancel; you can cancel anytime, but we don&apos;t provide prorated refunds for
            partial periods except where required by law. Tips and donations are final and non-refundable
            except as required by law or at our discretion.
          </p>
          <p className="mt-2">
            Payments made through the Service (tips, memberships, and donations) currently support the
            platform itself rather than being paid out to individual creators. We may change this model in the
            future; if so, we&apos;ll update these Terms and the relevant in-app disclosures first.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-white">8. Marketplace listings</h2>
          <p className="mt-2">
            The marketplace lets users list items for sale to other users. We are not a party to any
            transaction between a buyer and a seller, don&apos;t process marketplace payments, and don&apos;t
            guarantee the accuracy of any listing or the conduct of any buyer or seller. You use the
            marketplace at your own risk. Don&apos;t list anything illegal, stolen, counterfeit, or otherwise
            prohibited by law.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-white">9. Third-party services</h2>
          <p className="mt-2">
            The Service relies on third-party providers — including Stripe (payments), our email provider
            (account and notification emails), Cloudflare R2 (file storage), Giphy (GIF search), and Google
            Analytics (usage analytics) — to operate. Your use of features backed by these providers is also
            subject to their own terms and privacy policies.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-white">10. Our intellectual property</h2>
          <p className="mt-2">
            The Service itself — its design, branding, code, and features, excluding User Content — is owned by
            us or our licensors and protected by intellectual property law. These Terms don&apos;t grant you
            any right to use our branding or trademarks without permission.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-white">11. Termination</h2>
          <p className="mt-2">
            You may stop using the Service and request account deletion at any time by contacting us. We may
            suspend or terminate your access for violating these Terms, at our discretion. Sections that by
            their nature should survive termination (content license already granted, disclaimers, limitation
            of liability) will survive.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-white">12. Disclaimers</h2>
          <p className="mt-2">
            The Service is provided &quot;as is&quot; and &quot;as available,&quot; without warranties of any
            kind, express or implied, including merchantability, fitness for a particular purpose, and
            non-infringement. We don&apos;t warrant that the Service will be uninterrupted, secure, or
            error-free, or that any content is accurate or reliable.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-white">13. Limitation of liability</h2>
          <p className="mt-2">
            To the maximum extent permitted by law, we won&apos;t be liable for any indirect, incidental,
            special, consequential, or punitive damages, or any loss of data, revenue, or profits, arising from
            your use of the Service. Our total liability for any claim relating to the Service won&apos;t
            exceed the greater of $50 or the amount you paid us in the 12 months before the claim arose.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-white">14. Indemnification</h2>
          <p className="mt-2">
            You agree to indemnify and hold us harmless from any claims, damages, or expenses (including
            reasonable legal fees) arising from your User Content, your violation of these Terms, or your
            violation of any third party&apos;s rights.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-white">15. Governing law</h2>
          <p className="mt-2">
            These Terms are governed by the laws of the United States, without regard to conflict-of-law
            principles. Any dispute not subject to mandatory arbitration or small-claims jurisdiction will be
            resolved in the courts located where the Service operator resides, and you consent to that
            jurisdiction.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-white">16. Severability</h2>
          <p className="mt-2">
            If any provision of these Terms is found unenforceable, the remaining provisions stay in full
            effect, and the unenforceable provision will be modified to the minimum extent necessary to make it
            enforceable.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-white">17. Changes to these terms</h2>
          <p className="mt-2">
            We may revise these Terms from time to time. We&apos;ll update the &quot;Last updated&quot; date
            above when we do. Material changes will be highlighted on the Service. Continued use after changes
            take effect constitutes acceptance.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-white">18. Contact</h2>
          <p className="mt-2">
            Questions about these Terms? Email{" "}
            <a href="mailto:countryboya20@gmail.com" className="text-violet-400 hover:underline">
              countryboya20@gmail.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
