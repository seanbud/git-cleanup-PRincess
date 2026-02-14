import { GitHubUser } from '../types';

export class GitHubApiService {
    static async getAuthenticatedUser(token: string): Promise<GitHubUser> {
        const response = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user');
        }

        return response.json();
    }
}
