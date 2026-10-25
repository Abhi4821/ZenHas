package com.zenhas;




public enum MessageType {

    USER("user"),
    ASSISTANT("assistant"),
    SYSTEM("system"),
    TOOL("tool");

    private final String value;

    private MessageType(String value) {
        this.value = value;
    }

    public String getValue() {
        return this.value;
    }
}
