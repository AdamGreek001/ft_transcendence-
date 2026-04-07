import { getRequestConfig } from "next-intl/server";
import { headers } from "next/headers";
import { locales, defaultLocale, type Locale } from "./index";

export default getRequestConfig(async () => {
    // Detect locale from Accept-Language header or default
    const headersList = await headers();
    const acceptLanguage = headersList.get("accept-language") || "";
    
    // Parse the first preferred language
    const preferredLocale = acceptLanguage
        .split(",")[0]
        ?.split("-")[0]
        ?.toLowerCase();
    
    const locale: Locale = locales.includes(preferredLocale as Locale)
        ? (preferredLocale as Locale)
        : defaultLocale;

    return {
        locale,
        messages: (await import(`../../messages/${locale}.json`)).default,
    };
});
