package com.example.bookbe.utils;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;

public class LoggerUtil {

    private static Logger getLogger() {
        StackTraceElement[] stackTrace = Thread.currentThread().getStackTrace();
        // Lấy tên class ở vị trí thứ 3 trong Call Stack
        String callerClassName = stackTrace[3].getClassName();
        return LoggerFactory.getLogger(callerClassName);
    }

    public static void inform(String Message, Object... arg) {
        getLogger().info(Message,arg);
    }

    public static void warm(String message, Object... arg) {
        getLogger().warn(message,arg);
    }

    public static void error(String message, Throwable throwable) {
        getLogger().error(message,throwable);
    }

    public static void error(String messgage, Object... arg) {
        getLogger().error(messgage,arg);
    }


    public static void LogPerformance(String TaskName, long ExecuteTimeMS) {
        String requestId = MDC.get("requestId");
        getLogger().info("[PERFORMANCE] Task [{}] - RequestId: [{}] executed in {} ms", 
                TaskName, requestId != null ? requestId : "N/A", ExecuteTimeMS);
    }
}
