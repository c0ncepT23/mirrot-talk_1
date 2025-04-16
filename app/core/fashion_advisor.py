# app/core/fashion_advisor.py
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_anthropic import ChatAnthropic
from langchain_openai import ChatOpenAI
from langchain.memory import ConversationBufferMemory
from config import ANTHROPIC_API_KEY, OPENAI_API_KEY
import os

from app.models.blip_model import FashionBLIPModel

class FashionAdvisor:
    """Fashion advisor powered by BLIP and Claude LLM"""
    
    def __init__(self, api_key=ANTHROPIC_API_KEY):
        """Initialize the fashion advisor"""
        # Set API keys in environment
        if ANTHROPIC_API_KEY:
            os.environ["ANTHROPIC_API_KEY"] = ANTHROPIC_API_KEY
        if OPENAI_API_KEY:
            os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY
        
        # Initialize BLIP model
        self.blip_model = FashionBLIPModel()
        # Choose which model to use
        use_openai = True  # Set to False to use Anthropic

        if use_openai:
            self.llm = ChatOpenAI(
                model="gpt-4o",
                temperature=0.7,
                max_tokens=1000
            )
        else:
        
            # Initialize LLM with Claude
            self.llm = ChatAnthropic(
                model="claude-3-7-sonnet-20250219",
                temperature=0.7,
                max_tokens=1000
            )
        
        # Create memory
        self.memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)
        
        # Create prompt template
        self.prompt = PromptTemplate(
            input_variables=["outfit_description", "style_goals", "chat_history", "user_input"],
            template="""
            You are FashionBot, an expert fashion advisor with deep knowledge of style, color theory, and current trends.

            The user has uploaded an outfit image. Here is a detailed description of what they're wearing:
            {outfit_description}

            User's style goals and preferences:
            {style_goals}

            Based on this information, provide personalized style advice in the following structured format:
            
            # Outfit Rating: [X]/100
            
            ## Quick Take
            [Provide a one-line summary about the overall outfit style]
            
            ## Highlights
            [What stands out about this outfit - could be fit, silhouette, a particular piece, etc.]
            
            ## Color Analysis
            [How the colors work together, what they communicate, any color theory insights]
            
            ## Suggestions
            [3-4 bullet points with specific recommendations to enhance the look]
            
            ## Versatility
            [Brief notes on how this outfit could work for different occasions with minor tweaks]

            Previous conversation:
            {chat_history}

            User: {user_input}
            FashionBot:
            """
        )
        
        # Create the modern LangChain chain using pipeline syntax
        self.chain = (
            {
                "outfit_description": RunnablePassthrough(),
                "style_goals": RunnablePassthrough(),
                "user_input": RunnablePassthrough(),
                "chat_history": lambda _: self.memory.load_memory_variables({})["chat_history"]
            }
            | self.prompt
            | self.llm
        )
    
    async def analyze_image(self, image_path):
        """Analyze an outfit image and return a description"""
        try:
            print(f"Calling BLIP model for image: {image_path}")
            result = await self.blip_model.get_comprehensive_analysis(image_path)
            print(f"BLIP model returned result: {result[:50]}...")
            return result
        except Exception as e:
            import traceback
            tb = traceback.format_exc()
            error_msg = f"Error in analyze_image: {str(e)}\n{tb}"
            print(error_msg)
            raise Exception(error_msg)
    
    async def get_fashion_advice(self, outfit_description, user_input, style_goals=""):
        """Get fashion advice based on outfit description and user input"""
        try:
            # Use the updated chain
            response = self.chain.invoke({
                "outfit_description": outfit_description,
                "style_goals": style_goals,
                "user_input": user_input
            })
            
            # Store the interaction in memory
            self.memory.save_context(
                {"input": user_input},
                {"output": response.content}
            )
            
            return response.content
            
        except Exception as e:
            print(f"Error in get_fashion_advice: {e}")
            import traceback
            traceback.print_exc()
            raise e