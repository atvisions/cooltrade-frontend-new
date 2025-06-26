const GOOGLE_API_KEY = 'AIzaSyCJod07SIklxTIawm8qqm1dbaYVtgr9VjM';

export async function googleTranslate(text: string, targetLang: string): Promise<string> {
  const url = `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_API_KEY}`;
  const body = {
    q: text,
    target: targetLang,
    format: 'text'
  };
  const res = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' }
  });
  const data = await res.json();
  if (data && data.data && data.data.translations && data.data.translations[0]) {
    return data.data.translations[0].translatedText;
  }
  return text;
} 