package com.example.bookbe.service;

import java.time.LocalDateTime;
import java.util.Queue;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.example.bookbe.entity.RevokedToken;
import com.example.bookbe.repository.RevokedTokenRepository;

@Service
public class RateLimiterService {

    @Value("${app.rate-limit.token.max-requests:60}")
    private int tokenMaxRequests;

    @Value("${app.rate-limit.token.window-seconds:60}")
    private long tokenWindowSeconds;

    @Value("${app.rate-limit.ip.max-requests:100}")
    private int ipMaxRequests;

    @Value("${app.rate-limit.ip.window-seconds:60}")
    private long ipWindowSeconds;

    @Value("${app.rate-limit.refresh.max-requests:3}")
    private int refreshMaxRequests;

    @Value("${app.rate-limit.refresh.window-seconds:60}")
    private long refreshWindowSeconds;

    @Value("${app.rate-limit.ip-block-seconds:1800}")
    private long ipBlockSeconds;

    private final RevokedTokenRepository revokedTokenRepository;

    // Track request timestamps for sliding window algorithm
    private final ConcurrentHashMap<String, Queue<Long>> requestTracker = new ConcurrentHashMap<>();

    // In-memory blacklist for IPs with expiration timestamp (ms)
    private final ConcurrentHashMap<String, Long> ipBlacklist = new ConcurrentHashMap<>();

    // In-memory cache for revoked tokens
    private final Set<String> revokedTokenCache = ConcurrentHashMap.newKeySet();

    public RateLimiterService(RevokedTokenRepository revokedTokenRepository) {
        this.revokedTokenRepository = revokedTokenRepository;
    }

    /**
     * Check if IP is currently blocked/blacklisted.
     */
    public boolean isIpBlocked(String ip) {
        Long blockedUntil = ipBlacklist.get(ip);
        if (blockedUntil == null) {
            return false;
        }
        if (System.currentTimeMillis() > blockedUntil) {
            ipBlacklist.remove(ip);
            return false;
        }
        return true;
    }

    /**
     * Block an IP for configured block duration in seconds (e.g. 30 minutes).
     */
    public void blockIp(String ip) {
        long blockedUntil = System.currentTimeMillis() + (ipBlockSeconds * 1000L);
        ipBlacklist.put(ip, blockedUntil);
    }

    /**
     * Check rate limit for IP on /api/auth/refresh endpoint.
     * Returns true if allowed, false if limit exceeded.
     */
    public boolean allowRefreshRequest(String ip) {
        String key = "REFRESH_IP:" + ip;
        return checkSlidingWindow(key, refreshMaxRequests, refreshWindowSeconds);
    }

    /**
     * Check general rate limit for IP (100 req / min).
     * Returns true if allowed, false if limit exceeded.
     */
    public boolean allowIpRequest(String ip) {
        String key = "IP:" + ip;
        return checkSlidingWindow(key, ipMaxRequests, ipWindowSeconds);
    }

    /**
     * Check rate limit for Access Token (60 req / min).
     * Returns true if allowed, false if limit exceeded.
     */
    public boolean allowTokenRequest(String token) {
        String key = "TOKEN:" + token;
        return checkSlidingWindow(key, tokenMaxRequests, tokenWindowSeconds);
    }

    /**
     * Check if token has been revoked / blacklisted.
     */
    public boolean isTokenRevoked(String token) {
        if (token == null || token.isBlank()) {
            return false;
        }
        if (revokedTokenCache.contains(token)) {
            return true;
        }
        if (revokedTokenRepository.existsByToken(token)) {
            revokedTokenCache.add(token);
            return true;
        }
        return false;
    }

    /**
     * Revoke access token permanently and add to blacklist.
     */
    public void revokeToken(String token) {
        if (token == null || token.isBlank()) {
            return;
        }
        revokedTokenCache.add(token);
        if (!revokedTokenRepository.existsByToken(token)) {
            RevokedToken revokedToken = new RevokedToken();
            revokedToken.setToken(token);
            revokedToken.setCreatedAt(LocalDateTime.now());
            revokedTokenRepository.save(revokedToken);
        }
    }

    /**
     * Helper sliding window rate limiting algorithm.
     */
    private boolean checkSlidingWindow(String key, int maxRequests, long windowSeconds) {
        long now = System.currentTimeMillis();
        long windowStart = now - (windowSeconds * 1000L);

        Queue<Long> timestamps = requestTracker.computeIfAbsent(key, k -> new ConcurrentLinkedQueue<>());

        // Evict expired timestamps outside current window
        while (!timestamps.isEmpty() && timestamps.peek() < windowStart) {
            timestamps.poll();
        }

        if (timestamps.size() >= maxRequests) {
            return false;
        }

        timestamps.add(now);
        return true;
    }

    public long getIpBlockSeconds() {
        return ipBlockSeconds;
    }
}
