package com.example.bookbe.security;

import java.io.IOException;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import com.example.bookbe.service.RateLimiterService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private final RateLimiterService rateLimiterService;

    public RateLimitingFilter(RateLimiterService rateLimiterService) {
        this.rateLimiterService = rateLimiterService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String clientIp = getClientIp(request);
        String requestUri = request.getRequestURI();

        // 1. Kiểm tra IP Blacklist
        if (rateLimiterService.isIpBlocked(clientIp)) {
            sendErrorResponse(response, HttpStatus.TOO_MANY_REQUESTS.value(),
                    "IP của bạn đã bị khóa " + (rateLimiterService.getIpBlockSeconds() / 60) + " phút do vi phạm giới hạn request.");
            return;
        }

        // 2. Kiểm tra giới hạn endpoint Refresh Token (/api/auth/refresh)
        if (requestUri.equals("/api/auth/refresh")) {
            if (!rateLimiterService.allowRefreshRequest(clientIp)) {
                rateLimiterService.blockIp(clientIp);
                sendErrorResponse(response, HttpStatus.TOO_MANY_REQUESTS.value(),
                        "Vượt quá giới hạn refresh token (tối đa 3 lần/phút). Địa chỉ IP của bạn đã bị khóa 30 phút.");
                return;
            }
        }

        // 3. Kiểm tra giới hạn chung cho IP (100 req/phút)
        if (!rateLimiterService.allowIpRequest(clientIp)) {
            sendErrorResponse(response, HttpStatus.TOO_MANY_REQUESTS.value(),
                    "Địa chỉ IP của bạn đã vượt quá giới hạn request cho phép (100 request/phút).");
            return;
        }

        // 4. Kiểm tra giới hạn cho Access Token (60 req/phút)
        String token = getJwtFromRequest(request);
        if (StringUtils.hasText(token)) {
            if (rateLimiterService.isTokenRevoked(token)) {
                sendErrorResponse(response, HttpStatus.UNAUTHORIZED.value(),
                        "Access token này đã bị thu hồi hoặc cho vào danh sách đen.");
                return;
            }

            if (!rateLimiterService.allowTokenRequest(token)) {
                rateLimiterService.revokeToken(token);
                sendErrorResponse(response, HttpStatus.TOO_MANY_REQUESTS.value(),
                        "Access token đã vượt quá giới hạn 60 request/phút và đã bị đưa vào danh sách đen.");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (StringUtils.hasText(xfHeader)) {
            return xfHeader.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (StringUtils.hasText(xRealIp)) {
            return xRealIp.trim();
        }
        return request.getRemoteAddr();
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }

    private void sendErrorResponse(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        String json = String.format("{\"status\":%d,\"error\":\"%s\",\"message\":\"%s\"}",
                status,
                status == 401 ? "Unauthorized" : "Too Many Requests",
                message);
        response.getWriter().write(json);
    }
}
