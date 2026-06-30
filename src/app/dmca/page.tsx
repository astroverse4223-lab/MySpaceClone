import type { Metadata } from "next";
import { DmcaForm } from "@/components/dmca/dmca-form";

export const metadata: Metadata = {
  title: "Copyright / DMCA Policy",
  description: "How to report copyright infringement on MySpace Reborn and submit a takedown notice.",
};

export default function DmcaPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-semibold">Copyright / DMCA Policy</h1>
      <p className="mt-2 text-sm text-white/50">Last updated June 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-white/70">
        <section>
          <h2 className="text-base font-medium text-white">Overview</h2>
          <p className="mt-2">
            MySpace Reborn lets users upload content to their profiles and posts, including profile songs,
            playlist links, photos, and videos. We respect intellectual property rights and respond to valid
            notices of alleged copyright infringement under the Digital Millennium Copyright Act (DMCA), 17
            U.S.C. &sect; 512.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-white">Filing a takedown notice</h2>
          <p className="mt-2">
            If you believe content on this site infringes your copyright, submit a notice using the form below.
            A valid notice must include:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Identification of the copyrighted work you claim has been infringed.</li>
            <li>The exact location (URL) of the allegedly infringing material on this site.</li>
            <li>Your contact information (name and email).</li>
            <li>A statement that you have a good faith belief the use is not authorized.</li>
            <li>A statement, under penalty of perjury, that the notice is accurate and you are authorized to act.</li>
            <li>Your physical or electronic signature.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-medium text-white">What happens next</h2>
          <p className="mt-2">
            We review each notice and, where it's valid, remove or disable access to the reported content. We
            may also terminate accounts of users who are repeat infringers.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-white">Counter-notification</h2>
          <p className="mt-2">
            If content you posted was removed and you believe it was a mistake or misidentification, you can
            submit a counter-notice by emailing the contact below with the removed content's original location,
            a statement under penalty of perjury that the removal was in error, and your consent to the
            jurisdiction of the federal court for your district (or, if outside the U.S., any judicial district
            in which the site operator may be found).
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-white">Contact</h2>
          <p className="mt-2">
            Email{" "}
            <a href="mailto:countryboya20@gmail.com" className="text-violet-400 hover:underline">
              countryboya20@gmail.com
            </a>{" "}
            for counter-notices or questions about this policy. For takedown notices, please use the form below
            so it's logged and tracked.
          </p>
        </section>
      </div>

      <div className="mt-10">
        <h2 className="text-base font-medium text-white">Submit a takedown notice</h2>
        <div className="mt-3">
          <DmcaForm />
        </div>
      </div>
    </div>
  );
}
