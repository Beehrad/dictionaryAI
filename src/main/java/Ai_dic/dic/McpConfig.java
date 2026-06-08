package Ai_dic.dic;

import org.springframework.ai.tool.method.MethodToolCallbackProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class McpConfig {
    @Bean

    public MethodToolCallbackProvider methodToolCallbackProvider(DictionaryTool dictionaryTool) {
        return MethodToolCallbackProvider.builder()
                .toolObjects(dictionaryTool)
                .build();
    }
}
