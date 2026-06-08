package Ai_dic.dic;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/ai")
public class AgentController {
    private final ChatClient chatClient;

    public AgentController(ChatClient.Builder chatClientBuilder, DictionaryTool dictionaryTool) {
        this.chatClient = chatClientBuilder
                .defaultTools(dictionaryTool)
                .build();
    }

    @GetMapping("/chat")
    public String chat(@RequestParam String message) {
        return chatClient.prompt()
                .user(message)
                .call()
                .content();
    }
}
