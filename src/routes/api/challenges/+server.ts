import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { GoogleSheetsService } from '$lib/services/GoogleSheetsService';
import type { ApiResponse } from '$lib/types';

const sheetsService = new GoogleSheetsService();

export const GET: RequestHandler = async ({ url }) => {
  try {
    const category = url.searchParams.get('category');
    const difficulty = url.searchParams.get('difficulty');
    const role = url.searchParams.get('role');
    const refresh = url.searchParams.get('refresh') === 'true';
    
    let challenges;
    
    if (refresh) {
      challenges = await sheetsService.refreshCache();
    } else if (category) {
      challenges = await sheetsService.getChallengesByCategory(category);
    } else if (difficulty) {
      challenges = await sheetsService.getChallengesByDifficulty(difficulty);
    } else if (role) {
      challenges = await sheetsService.getChallengesByRole(role);
    } else {
      challenges = await sheetsService.getChallenges();
    }
    
    return json<ApiResponse<typeof challenges>>({
      success: true,
      data: challenges,
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('Error fetching challenges:', error);
    return json<ApiResponse>({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to fetch challenges'
      },
      timestamp: new Date()
    }, { status: 500 });
  }
};