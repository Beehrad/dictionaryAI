package Ai_dic.dic;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.RETURNS_DEEP_STUBS;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AgentControllerTests {
    private MockMvc mvc;
    private ChatClient client;

    @BeforeEach
    void setUp() {
        ChatClient.Builder builder = mock(ChatClient.Builder.class);
        client = mock(ChatClient.class, RETURNS_DEEP_STUBS);
        when(builder.defaultSystem(anyString())).thenReturn(builder);
        when(builder.build()).thenReturn(client);
        mvc = MockMvcBuilders.standaloneSetup(new AgentController(builder)).build();
    }

    @Test
    void translatesTextBody() throws Exception {
        String text = "\u0633\u0644\u0627\u0645";
        when(client.prompt().user(text).call().content()).thenReturn("Hallo");

        mvc.perform(post("/ai/chat")
                        .contentType("text/plain;charset=UTF-8")
                        .content(text))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.TEXT_PLAIN))
                .andExpect(content().string("Hallo"));
    }

    @Test
    void preservesGetEndpoint() throws Exception {
        when(client.prompt().user("Hallo").call().content()).thenReturn("Translation");

        mvc.perform(get("/ai/chat").param("message", "Hallo"))
                .andExpect(status().isOk())
                .andExpect(content().string("Translation"));
    }

    @Test
    void rejectsBlankText() throws Exception {
        mvc.perform(post("/ai/chat").contentType(MediaType.TEXT_PLAIN).content(" \n "))
                .andExpect(status().isBadRequest());
    }
}
