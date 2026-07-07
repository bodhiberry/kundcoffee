import { Receipt } from "lucide-react";

const SITE_URL = "https://www.xolacloud.com";
const LOGIN_URL = "/login";

export default function AuthFooter() {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-50 py-14">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
          {/* Brand */}
          <div className="max-w-xs">
            <div className="flex items-center gap-2 text-base font-bold text-zinc-900">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-900 text-white">
                <Receipt size={14} />
              </span>
              XolaCloud
            </div>
            <p className="mt-3 text-sm text-zinc-500">
              Multi-branch POS and ERP for restaurants and cafés, built and
              supported in Nepal.
            </p>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Product
              </div>
              <ul className="mt-3 space-y-2 text-sm text-zinc-500">
                <li>
                  <a href={`${SITE_URL}/#features`} className="hover:text-zinc-900">
                    Features
                  </a>
                </li>
                <li>
                  <a href={`${SITE_URL}/#pricing`} className="hover:text-zinc-900">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href={LOGIN_URL} className="hover:text-zinc-900">
                    Log in
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Company
              </div>
              <ul className="mt-3 space-y-2 text-sm text-zinc-500">
                <li>
                  <a href={SITE_URL} className="hover:text-zinc-900">
                    About
                  </a>
                </li>
                <li>
                  <a href={`${SITE_URL}/#faq`} className="hover:text-zinc-900">
                    FAQ
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:infobodhiberry@gmail.com"
                    className="hover:text-zinc-900"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Legal
              </div>
              <ul className="mt-3 space-y-2 text-sm text-zinc-500">
                <li>
                  <a href="#" className="hover:text-zinc-900">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-zinc-900">
                    Terms
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col-reverse items-center justify-between gap-4 border-t border-zinc-200 pt-6 sm:flex-row">
          <p className="text-xs text-zinc-400">
            &copy; {new Date().getFullYear()} XolaCloud. All rights reserved.
          </p>
          <p className="text-xs text-zinc-400">Made for restaurants in Nepal 🇳🇵</p>
        </div>
      </div>
    </footer>
  );
}
