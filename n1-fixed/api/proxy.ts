export default async function handler(req: any, res: any) {
  const path = req.query.path as string;
  const url = `https://api.n1.xyz${path}`;
  const response = await fetch(url);
  const data = await response.json();
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json(data);
}