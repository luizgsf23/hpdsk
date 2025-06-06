
import React, { useState, useEffect } from 'react';
import type { Session as SupabaseSession } from '@supabase/supabase-js';
import type { UserProfile, AppFeedback } from '../types'; 
import { supabase } from '../services/supabaseClient'; 
import FeedbackAlert from './FeedbackAlert';
import LoadingSpinner from './LoadingSpinner';
import { UserCircleIcon, KeyIcon, ArrowLeftIcon, CheckCircleIcon } from './icons';

interface UserProfilePageProps {
  session: SupabaseSession | null;
  userProfile: UserProfile | null;
  isProfileLoading: boolean;
  onUpdateProfile: (userId: string, dataToUpdate: { full_name?: string | null; department?: string | null }) => Promise<AppFeedback>;
  onUpdatePassword: (newPassword: string) => Promise<AppFeedback>;
  onBack: () => void;
  setGlobalAppFeedback: (feedback: AppFeedback | null) => void;
}

const UserProfilePage: React.FC<UserProfilePageProps> = ({
  session,
  userProfile,
  isProfileLoading,
  onUpdateProfile,
  onUpdatePassword,
  onBack,
  setGlobalAppFeedback
}) => {
  const [fullNameInput, setFullNameInput] = useState('');
  const [departmentInput, setDepartmentInput] = useState('');
  
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');

  const [profileFeedback, setProfileFeedback] = useState<AppFeedback | null>(null);
  const [passwordFeedback, setPasswordFeedback] = useState<AppFeedback | null>(null);
  
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setFullNameInput(userProfile.full_name || '');
      setDepartmentInput(userProfile.department || '');
    }
  }, [userProfile]);

  const handleProfileUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileFeedback(null);
    if (!session?.user?.id) {
      setProfileFeedback({ type: 'error', message: 'Sessão de usuário inválida.' });
      return;
    }
    if (fullNameInput.trim() === (userProfile?.full_name || '') && departmentInput.trim() === (userProfile?.department || '')) {
      setProfileFeedback({ type: 'info', message: 'Nenhuma alteração detectada nos dados pessoais.' });
      return;
    }
    setIsUpdatingProfile(true);
    const result = await onUpdateProfile(session.user.id, {
      full_name: fullNameInput.trim() || null,
      department: departmentInput.trim() || null,
    });
    setProfileFeedback(result);
    setIsUpdatingProfile(false);
    if (result.type === 'success') {
        setGlobalAppFeedback(result); 
    }
  };

  const handlePasswordUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);
    if (!newPasswordInput) {
      setPasswordFeedback({ type: 'error', message: 'Nova senha não pode estar vazia.' });
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      setPasswordFeedback({ type: 'error', message: 'As senhas não coincidem.' });
      return;
    }
    if (newPasswordInput.length < 6) {
      setPasswordFeedback({type: 'error', message: 'A nova senha deve ter pelo menos 6 caracteres.'});
      return;
    }

    setIsUpdatingPassword(true);
    const result = await onUpdatePassword(newPasswordInput);
    setPasswordFeedback(result);
    setIsUpdatingPassword(false);
    if (result.type === 'success') {
      setNewPasswordInput('');
      setConfirmPasswordInput('');
      setGlobalAppFeedback(result); 
    }
  };

  if (isProfileLoading && !userProfile) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 bg-gray-800 rounded-lg shadow-xl">
        <LoadingSpinner size="w-12 h-12" />
        <p className="mt-4 text-gray-300">Carregando perfil...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-gray-900 rounded-lg shadow-xl h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800 text-gray-100">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-700">
        <div className="flex items-center">
            <UserCircleIcon className="w-7 h-7 sm:w-8 sm:h-8 mr-2 sm:mr-3 text-purple-400" />
            <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-purple-400">Meu Perfil</h1>
        </div>
        <button
            onClick={onBack}
            className="text-gray-400 hover:text-gray-200 transition-colors p-2 rounded-md hover:bg-gray-700"
            aria-label="Voltar"
        >
            <ArrowLeftIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Basic Info Section */}
      <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-purple-300 mb-3 sm:mb-4">Informações da Conta</h2>
        <div className="space-y-2 sm:space-y-3 text-sm">
          <div>
            <span className="font-medium text-gray-400">Email: </span>
            <span className="text-gray-200 break-all">{session?.user?.email || 'N/A'}</span>
          </div>
          <div>
            <span className="font-medium text-gray-400">Função (Role): </span>
            <span className="text-gray-200">{userProfile?.role || 'N/A'}</span>
          </div>
          {userProfile?.created_at && 
            <div>
                <span className="font-medium text-gray-400">Membro Desde: </span>
                <span className="text-gray-200">{new Date(userProfile.created_at).toLocaleDateString('pt-BR')}</span>
            </div>
          }
        </div>
      </div>

      {/* Edit Personal Data Section */}
      <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-purple-300 mb-1">Dados Pessoais</h2>
        <p className="text-xs text-gray-400 mb-3 sm:mb-4">Atualize seu nome completo e setor/departamento.</p>
        
        {profileFeedback && <FeedbackAlert type={profileFeedback.type} message={profileFeedback.message} onDismiss={() => setProfileFeedback(null)} className="mb-4" />}
        
        <form onSubmit={handleProfileUpdateSubmit} className="space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-1">Nome Completo</label>
            <input
              type="text"
              id="fullName"
              value={fullNameInput}
              onChange={(e) => setFullNameInput(e.target.value)}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400"
              placeholder="Seu nome completo"
              disabled={isUpdatingProfile}
            />
          </div>
          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-300 mb-1">Setor/Departamento</label>
            <input
              type="text"
              id="department"
              value={departmentInput}
              onChange={(e) => setDepartmentInput(e.target.value)}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400"
              placeholder="Seu setor ou departamento"
              disabled={isUpdatingProfile}
            />
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isUpdatingProfile || isProfileLoading}
              className="w-full sm:w-auto px-5 py-2.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed text-sm font-medium"
            >
              {isUpdatingProfile ? <LoadingSpinner size="w-5 h-5" /> : <CheckCircleIcon className="w-5 h-5 mr-2"/>}
              {isUpdatingProfile ? 'Salvando...' : 'Salvar Dados Pessoais'}
            </button>
          </div>
        </form>
      </div>

      {/* Change Password Section */}
      <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md">
        <h2 className="text-lg sm:text-xl font-semibold text-purple-300 mb-1 flex items-center">
            <KeyIcon className="w-5 h-5 mr-2" /> Alterar Senha
        </h2>
        <p className="text-xs text-gray-400 mb-3 sm:mb-4">Escolha uma senha forte e não a compartilhe.</p>

        {passwordFeedback && <FeedbackAlert type={passwordFeedback.type} message={passwordFeedback.message} onDismiss={() => setPasswordFeedback(null)} className="mb-4" />}
        
        <form onSubmit={handlePasswordUpdateSubmit} className="space-y-4">
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300 mb-1">Nova Senha</label>
            <input
              type="password"
              id="newPassword"
              value={newPasswordInput}
              onChange={(e) => setNewPasswordInput(e.target.value)}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400"
              placeholder="Mínimo 6 caracteres"
              disabled={isUpdatingPassword}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">Confirmar Nova Senha</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPasswordInput}
              onChange={(e) => setConfirmPasswordInput(e.target.value)}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400"
              placeholder="Repita a nova senha"
              disabled={isUpdatingPassword}
              autoComplete="new-password"
            />
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isUpdatingPassword || isProfileLoading}
              className="w-full sm:w-auto px-5 py-2.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed text-sm font-medium"
            >
              {isUpdatingPassword ? <LoadingSpinner size="w-5 h-5" /> : <KeyIcon className="w-5 h-5 mr-2"/>}
              {isUpdatingPassword ? 'Alterando...' : 'Alterar Senha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserProfilePage;
