package com.zenhas;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.stereotype.Service;
import org.springframework.ai.chat.messages.Message;

import java.util.ArrayList;
import java.util.List;

@Service
public class SummrizeService {

    private final ChatClient chatClient;

    private List<Message>history=new ArrayList<>();

    public SummrizeService(ChatClient.Builder builder) {
        this.chatClient = builder.build();
    }

    public String summarize(String ticket) {

        System.out.println("START SERVICE");
        System.out.println("Ticket = " + ticket);

        String prompt = """
            Summarize the customer support ticket below.

            STRICT OUTPUT RULES:
            - Return exactly 2 lines.
            - Use normal spaces between all words.
            - Do NOT use Markdown.
            - Do NOT use **, *, #, -, bullets, numbering, or quotes.
            - Do NOT add any introduction or explanation.
            - Line 1 must describe the main problem.
            - Line 2 must describe what the customer wants.

            Customer Ticket:
            """ + ticket;

//        return chatClient
//                .prompt()
//                .user(prompt)
//                .call()
//                .content()
//                .replace("**", "")
//                .replace("*", "")
//                .trim();

        String result = chatClient
                .prompt()
                .user(prompt)
                .call()
                .content();

        String[] lines = result
                .replace("**", "")
                .replace("*", "")
                .trim()
                .split("\\R+");

        if (lines.length >= 2) {
            return lines[0].trim() + "\n" + lines[1].trim();
        }

        return result.trim();
    }



    public String chat(String message) {
        history.add(new UserMessage(message));
        String output = chatClient
                .prompt()
                .messages(history)
                .call()
                .content();
        history.add(new AssistantMessage(output));
        return output;
    }
}