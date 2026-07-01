/**
 * Security Middleware
 * Implements strict HTTP security headers including Content-Security-Policy (CSP)
 */

export const securityHeaders = (req, res, next) => {
    // Content Security Policy
    const csp = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-eval needed for some React setups in dev
        "style-src 'self' 'unsafe-inline'", // Tailwind/Antd often use inline styles
        "img-src 'self' data: https:",
        "font-src 'self' data:",
        "connect-src 'self' http://localhost:* https://*",
        "frame-ancestors 'none'", // Prevent clickjacking
        "object-src 'none'",
        "base-uri 'self'"
    ].join('; ');

    // Set standard security headers
    res.setHeader('Content-Security-Policy', csp);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Remove the X-Powered-By header
    res.removeHeader('X-Powered-By');

    next();
};
