package Ai_dic.dic;

import org.springframework.ai.tool.annotation.Tool;
import org.springframework.stereotype.Component;

@Component
public class DictionaryTool {
    @Tool(description = "tarjome farsi, ba mesale kootah")
    public String lookup(String word) {
        return  "Definition of " + word + ": a sample definition.";
    }

}
