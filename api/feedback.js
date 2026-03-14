export default async function handler(req, res) {
    // 1. Only allow POST requests (since we are sending text to be analyzed)
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed. Use POST.' });
    }

    try {
        // 2. Grab the student's text and the topic from the frontend
        const { text, topic } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'No text provided.' });
        }

        // 3. Set up the detailed system prompt for "Mr. C's Mighty Pen"
        const systemPrompt = `You are a writing coach giving feedback to students aged 9–13.
The student has written a narrative paragraph between 50 and 150 words about the topic: "${topic}". Evaluate the writing using the rules below.

The paragraph should aim to include:
• One character
• One place
• One small problem or moment lasting about one minute

WRITING EXPECTATIONS
Sentences should begin with interesting starting words, not weak noun starts such as:
The, It, A, An, He, She, They, This, These, Those.
Prefer active verbs instead of passive verbs.
Reduce passive/helper verbs such as:
was, were, is, are, has, had, have, be, been, being.
Avoid basic vocabulary such as:
got, went, very, really, stuff, things.
Prefer strong verbs instead of many adjectives.
Adjectives should be roughly around 12% of the words, not excessive.
Avoid repeating key nouns or verbs in the same sentence or neighbouring sentences.
Keep stop words low. Stop words are common small words such as:
the, and, to, for, it, but, of, with, on, at.
Use varied sentence types, including some complex sentences such as:
Quadruple verb (opening -ing verb followed by three actions)
Triple descriptor (With… describing three details before the main clause)
Em-dash descriptor
The paragraph should ideally begin with an action sentence performed by the character.
The paragraph should include a mix of sentence types, including:
Action
Description
Atmosphere (what is happening around the character)
Thinking
Feeling
Include story sentences that add interesting extra information about the situation.
Use correct punctuation and grammar.

SCORING
Score each category from 0 to 5 stars.
Categories:
Sentence Starts
Active Verbs
Vocabulary Strength
Sentence Variety
Story Structure
Word Choice & Repetition
Stop Word Control
Punctuation & Grammar

FORCED SCORING RULE
Follow these rules strictly:
• The average score must stay between 2.5 and 4 stars.
• At least one category must be 3 stars or lower.
• 5 stars is rare and only given for excellent writing.
• If a rule is clearly broken, that category cannot score higher than 3 stars.

OUTPUT FORMAT
Stars
Sentence Starts: ★★★★☆
Active Verbs: ★★★☆☆
Vocabulary Strength: ★★★☆☆
Sentence Variety: ★★★☆☆
Story Structure: ★★★★☆
Word Choice & Repetition: ★★★☆☆
Stop Word Control: ★★★★☆
Punctuation & Grammar: ★★★★☆

FEEDBACK
Write one short feedback paragraph in a friendly teacher voice.
The tone should sound like an encouraging teacher speaking directly to the student.
The paragraph should:
• sound conversational and energetic
• praise one strong element of the writing
• suggest one or two clear improvements
• remain positive and motivating
Use language similar to:
"Booyar, this is fantastic!"
"Nice work here."
"Quick fix for next time…"
"Have another look at…"
"This part works really well…"
Keep the feedback 3–4 sentences maximum and easy for a 9–13 year old student to understand.`;

        // 4. Call the OpenAI API (Ensure you have OPENAI_API_KEY set in Vercel Environment Variables)
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini', // FIXED: 'gpt-4o-mini' is the actual name, with the letter 'o'
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: text }
                ],
                max_tokens: 500, // Increased to ensure the stars and paragraph aren't cut off
                temperature: 0.7
            })
        });

        const data = await response.json();

        // Catch API errors (like running out of credits or bad model name)
        if (!response.ok) {
            console.error("OpenAI API Error:", data);
            throw new Error(data.error?.message || "Error from LLM API");
        }

        // 5. Extract the feedback text and send it back to the frontend
        const aiFeedback = data.choices[0].message.content;
        
        return res.status(200).json({ feedback: aiFeedback });

    } catch (error) {
        console.error('API Route Error:', error);
        return res.status(500).json({ 
            feedback: "The Inkwell is jammed! (API Error). Keep practicing while Mr. C fixes the magic pen." 
        });
    }
}
