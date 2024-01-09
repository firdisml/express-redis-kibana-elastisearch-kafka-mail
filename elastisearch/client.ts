import { Client } from '@elastic/elasticsearch'
import * as fs from 'fs';
import * as path from 'path';

const certificatePath = path.resolve(process.cwd(), 'http_ca.crt');

const client = new Client({
  node: 'https://localhost:9200',
  auth: {
      apiKey: 'TzJDODY0d0JBRzViRV9fSkp2QTY6TWhyX25FUzVTZkdYSFNLaE5yQTRydw=='
  },
  tls:{
    ca: fs.readFileSync(certificatePath)
   }
});

export default client;