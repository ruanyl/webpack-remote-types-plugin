import { downloadFile } from '../index'
import path from 'path'

describe('download file', () => {
    test('can download https files', async () => {
        const isSuccess = await downloadFile('https://jsonplaceholder.typicode.com/posts/1', path.resolve('src/__test__', 'downloadSpecHelper.json'))
        expect(isSuccess).toBe(true);
    });
    test('can download http files', async () => {
        const isSuccess = await downloadFile('http://jsonplaceholder.typicode.com/posts/1', path.resolve('src/__test__', 'downloadSpecHelper.json'))
        expect(isSuccess).toBe(true);
    });
})