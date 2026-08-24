package com.example.bookbe.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.example.bookbe.dto.ErrorRespone;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RefreshTokenException.class)
    public ResponseEntity<ErrorRespone> handlerRefreshTokenException(RefreshTokenException ex){
        ErrorRespone respone = new ErrorRespone(HttpStatus.FORBIDDEN.value(), ex.getMessage());

        return new ResponseEntity<>(respone,HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(ResourceNotFoundException.class) 
    public ResponseEntity<ErrorRespone> handlerResourceNotFoundException(ResourceNotFoundException ex) {
        ErrorRespone respone = new ErrorRespone(HttpStatus.NOT_FOUND.value(), ex.getMessage());

        return new ResponseEntity<>(respone,HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorRespone> handlerIllegalArgumentException(IllegalArgumentException ex) {
        ErrorRespone respone = new ErrorRespone(HttpStatus.BAD_REQUEST.value(), ex.getMessage());

        return new ResponseEntity<>(respone,HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorRespone> HandlerGlobalException(Exception ex) {
        ErrorRespone respone = new ErrorRespone(
            HttpStatus.INTERNAL_SERVER_ERROR.value(), 
            "Đã có lỗi xảy ra ở server thử lại sau"
        );
        return new ResponseEntity<>(respone,HttpStatus.INTERNAL_SERVER_ERROR);
    }


}
