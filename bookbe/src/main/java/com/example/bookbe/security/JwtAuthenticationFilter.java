package com.example.bookbe.security;

import java.io.IOException;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import com.example.bookbe.repository.UserRepository;
import com.example.bookbe.service.CustomUserDetailService;
import com.example.bookbe.utils.JwtTokenProvider;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.time.ZoneId;
import java.util.Date;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter  {

    private final CustomUserDetailService userDetailService;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;

    public JwtAuthenticationFilter(CustomUserDetailService userDetailService,
                                   JwtTokenProvider jwtTokenProvider,
                                   UserRepository userRepository) {
        this.userDetailService = userDetailService;
        this.jwtTokenProvider = jwtTokenProvider;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String token = getJwtFromRequest(request);
        if (StringUtils.hasText(token) && jwtTokenProvider.validateToken(token)) {
            String username = jwtTokenProvider.getUsernameFromToken(token);
            if (StringUtils.hasText(username)) {
                userRepository.findByUsername(username).ifPresent(user -> {
                    Date issuedAt = jwtTokenProvider.getIssuedAt(token);
                    boolean isInvalidated = false;
                    if (user.getTokenInvalidBefore() != null && issuedAt != null) {
                        long invalidBeforeMs = user.getTokenInvalidBefore()
                                .atZone(ZoneId.systemDefault())
                                .toInstant()
                                .toEpochMilli();
                        if (issuedAt.getTime() <= invalidBeforeMs) {
                            isInvalidated = true;
                        }
                    }

                    if (!isInvalidated) {
                        UserDetails userDetails = userDetailService.loadUserByUsername(username);
                        UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(
                                userDetails, null, userDetails.getAuthorities()
                        );
                        authenticationToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authenticationToken);
                    }
                });
            }
        }
        filterChain.doFilter(request, response);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
