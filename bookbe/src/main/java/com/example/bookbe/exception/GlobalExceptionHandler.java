package com.example.bookbe.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.example.bookbe.dto.ErrorRespone;

import jakarta.mail.MessagingException;


@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorRespone> handleAccessDeniedException(AccessDeniedException ex) {
        ErrorRespone response = new ErrorRespone(
            HttpStatus.FORBIDDEN.value(),
            ex.getMessage() != null ? ex.getMessage() : "Bạn không có quyền thực hiện thao tác này!"
        );
        return new ResponseEntity<>(response, HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorRespone> handleBadCredentialsException(BadCredentialsException ex) {
        ErrorRespone response = new ErrorRespone(
            HttpStatus.UNAUTHORIZED.value(),
            "Tên đăng nhập hoặc mật khẩu không chính xác."
        );
        return new ResponseEntity<>(response, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErrorRespone> handleAuthenticationException(AuthenticationException ex) {
        ErrorRespone response = new ErrorRespone(
            HttpStatus.UNAUTHORIZED.value(),
            ex.getMessage() != null ? ex.getMessage() : "Xác thực không thành công."
        );
        return new ResponseEntity<>(response, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(RefreshTokenException.class)
    public ResponseEntity<ErrorRespone> handlerRefreshTokenException(RefreshTokenException ex) {
        ErrorRespone response = new ErrorRespone(HttpStatus.FORBIDDEN.value(), ex.getMessage());
        return new ResponseEntity<>(response, HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorRespone> handlerResourceNotFoundException(ResourceNotFoundException ex) {
        ErrorRespone response = new ErrorRespone(HttpStatus.NOT_FOUND.value(), ex.getMessage());
        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorRespone> handlerIllegalArgumentException(IllegalArgumentException ex) {
        ErrorRespone response = new ErrorRespone(HttpStatus.BAD_REQUEST.value(), ex.getMessage());
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(MessagingException.class) 
    public ResponseEntity<ErrorRespone> handlerMessagingException(MessagingException ex) {
        ErrorRespone respone = new ErrorRespone(
            HttpStatus.INTERNAL_SERVER_ERROR.value()
            , "Không thể gửi email: Vui lòng kiểm tra lại địa chỉ email hoặc cấu hình mail server!"
        );
        return new ResponseEntity<>(respone,HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorRespone> HandlerGlobalException(Exception ex) {
        String message = (ex.getMessage() != null && !ex.getMessage().isBlank()) 
            ? ex.getMessage() 
            : "Đã có lỗi xảy ra ở server. Vui lòng thử lại sau.";
        ErrorRespone response = new ErrorRespone(
            HttpStatus.INTERNAL_SERVER_ERROR.value(),
            message
        );
        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
