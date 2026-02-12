from django.conf import settings


class AutoTrustOriginMiddleware:
    """
    In DEBUG mode, automatically add the request's origin to CSRF_TRUSTED_ORIGINS.
    This allows access from any IP (Tailscale, LAN, etc.) without manual config.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if settings.DEBUG:
            origin = request.META.get("HTTP_ORIGIN")
            if origin and hasattr(settings, "CSRF_TRUSTED_ORIGINS"):
                if origin not in settings.CSRF_TRUSTED_ORIGINS:
                    settings.CSRF_TRUSTED_ORIGINS.append(origin)
            elif origin:
                settings.CSRF_TRUSTED_ORIGINS = [origin]

            # Also trust based on Host header
            host = request.get_host()
            if host:
                http_origin = f"http://{host}"
                if not hasattr(settings, "CSRF_TRUSTED_ORIGINS"):
                    settings.CSRF_TRUSTED_ORIGINS = []
                if http_origin not in settings.CSRF_TRUSTED_ORIGINS:
                    settings.CSRF_TRUSTED_ORIGINS.append(http_origin)

        return self.get_response(request)
