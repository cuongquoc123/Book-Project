package com.example.bookbe.aspect;

import java.util.Arrays;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.AfterThrowing;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Aspect-Oriented Programming (AOP) Logging Aspect
 * Tự động ghi Log các yêu cầu API (Controller) và logic xử lý (Service)
 */
@Aspect
@Component
public class LoggingAspect {

    private final Logger log = LoggerFactory.getLogger(this.getClass());

    /**
     * Pointcut định vị tất cả các REST Controllers trong package com.example.bookbe.controller
     */
    @Pointcut("execution(* com.example.bookbe.controller..*.*(..))")
    public void controllerPointcut() {}

    /**
     * Pointcut định vị tất cả các Services trong package com.example.bookbe.service
     */
    @Pointcut("execution(* com.example.bookbe.service..*.*(..))")
    public void servicePointcut() {}

    /**
     * Around Advice: Đo lường thời gian thực thi và log thông tin API Request/Response
     */
    @Around("controllerPointcut()")
    public Object logControllerAccess(ProceedingJoinPoint joinPoint) throws Throwable {
        long startTime = System.currentTimeMillis();

        // Lấy thông tin HTTP Request hiện tại
        HttpServletRequest request = null;
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            request = attributes.getRequest();
        }

        String httpMethod = request != null ? request.getMethod() : "UNKNOWN";
        String requestUri = request != null ? request.getRequestURI() : "UNKNOWN";

        // Lấy thông tin tài khoản đang đăng nhập từ Security Context
        String currentUser = getCurrentUsername();

        String className = joinPoint.getSignature().getDeclaringType().getSimpleName();
        String methodName = joinPoint.getSignature().getName();
        Object[] args = joinPoint.getArgs();

        log.info("==> [API REQ] {} {} | User: {} | Method: {}.{}() | Args: {}",
                httpMethod, requestUri, currentUser, className, methodName, filterArguments(args));

        Object result;
        try {
            result = joinPoint.proceed();
            long duration = System.currentTimeMillis() - startTime;
            log.info("<== [API RES] {} {} | User: {} | Status: SUCCESS | Execution Time: {}ms",
                    httpMethod, requestUri, currentUser, duration);
            return result;
        } catch (Throwable ex) {
            long duration = System.currentTimeMillis() - startTime;
            log.error("<!= [API ERR] {} {} | User: {} | Error: {} | Execution Time: {}ms",
                    httpMethod, requestUri, currentUser, ex.getMessage(), duration);
            throw ex;
        }
    }

    /**
     * Around Advice cho tầng Service: Log thời gian xử lý logic nghiệp vụ
     */
    @Around("servicePointcut()")
    public Object logServiceExecution(ProceedingJoinPoint joinPoint) throws Throwable {
        long startTime = System.currentTimeMillis();
        String className = joinPoint.getSignature().getDeclaringType().getSimpleName();
        String methodName = joinPoint.getSignature().getName();

        log.debug("--> [SVC EXEC] {}.{}()", className, methodName);

        Object result = joinPoint.proceed();
        long duration = System.currentTimeMillis() - startTime;

        log.debug("<-- [SVC DONE] {}.{}() | Duration: {}ms", className, methodName, duration);
        return result;
    }

    /**
     * AfterThrowing Advice: Tự động ghi Log chi tiết khi có Ngoại lệ (Exception) xảy ra
     */
    @AfterThrowing(pointcut = "controllerPointcut() || servicePointcut()", throwing = "ex")
    public void logException(Throwable ex) {
        log.error("❌ [EXCEPTION THROWN] Detail: {} | Cause: {}",
                ex.getMessage(),
                ex.getCause() != null ? ex.getCause().getMessage() : "N/A");
    }

    /**
     * Lấy username của tài khoản đang đăng nhập từ Spring Security
     */
    private String getCurrentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return auth.getName();
        }
        return "Anonymous/Public";
    }

    /**
     * Lọc danh sách tham số để tránh in ra dữ liệu nhạy cảm hoặc đối tượng phức tạp
     */
    private String filterArguments(Object[] args) {
        if (args == null || args.length == 0) return "[]";
        return Arrays.toString(Arrays.stream(args)
                .map(arg -> {
                    if (arg == null) return "null";
                    String str = arg.toString();
                    if (str.toLowerCase().contains("password")) return "*****";
                    return str;
                })
                .toArray());
    }
}
