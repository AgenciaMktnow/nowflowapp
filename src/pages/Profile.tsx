import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/layout/Header/Header';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export default function Profile() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [full_name, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (user) {
            setFullName(user.user_metadata?.full_name || '');
            setEmail(user.email || '');
            setRole(user.user_metadata?.role || ''); // Assuming 'role' is in metadata
            setAvatarUrl(user.user_metadata?.avatar_url || null);
        }
    }, [user]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (password && password !== confirmPassword) {
            toast.error('As senhas não conferem.');
            setLoading(false);
            return;
        }

        try {
            const updates: any = {
                data: {
                    full_name,
                    role,
                    avatar_url: avatarUrl // Ensure avatar URL is persisted
                }
            };

            // Only update email if changed (requires verification flow usually)
            if (email !== user?.email) {
                updates.email = email;
            }

            // Update password if provided
            if (password) {
                updates.password = password;
            }

            const { error } = await supabase.auth.updateUser(updates);

            if (error) throw error;

            // Also update public users table if it exists (Optional/Best Practice)
            if (user) {
                const { error: publicError } = await supabase
                    .from('users')
                    .update({ full_name, avatar_url: avatarUrl })
                    .eq('id', user.id);

                if (publicError) console.warn('Error updating public user record:', publicError);
            }

            if (email !== user?.email) {
                toast.success('Solicitação de troca de e-mail enviada!', {
                    description: 'Verifique a caixa de entrada do seu NOVO e-mail para confirmar a alteração.',
                    duration: 8000,
                });
            } else {
                toast.success('Perfil atualizado com sucesso!');
            }

            setPassword('');
            setConfirmPassword('');

            // If email changed, we don't want to reload immediately as it might look confusing
            if (email === user?.email) {
                window.location.reload();
            }

        } catch (error: any) {
            console.error('Error updating profile:', error);
            toast.error(`Erro ao atualizar perfil: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0 || !user) return;

        const file = event.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        try {
            setLoading(true);

            // 1. Upload to Storage
            const { error: uploadError } = await supabase.storage
                .from('avatars') // Standard Supabase bucket for avatars
                .upload(filePath, file, { upsert: true });

            if (uploadError) {
                // Try creating bucket if it doesn't exist (only admin can do this usually, but worth a try in dev)
                if (uploadError.message.includes('Bucket not found')) {
                    alert('Bucket "avatars" não encontrado. Crie-o no Supabase Storage.');
                    throw uploadError;
                }
                throw uploadError;
            }

            // 2. Get Public URL
            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
            const publicUrl = data.publicUrl;

            // 3. Update User Metadata immediately to show preview
            const { error: updateError } = await supabase.auth.updateUser({
                data: { avatar_url: publicUrl }
            });

            if (updateError) throw updateError;

            setAvatarUrl(publicUrl);
            toast.success('Foto de perfil atualizada!');

        } catch (error: any) {
            console.error('Error uploading avatar:', error);
            toast.error(`Erro ao fazer upload da foto: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-background-dark">
            <Header title="Meu Perfil" />

            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="max-w-2xl mx-auto flex flex-col gap-8 bg-surface-dark border border-white/5 p-6 md:p-10 rounded-2xl shadow-xl">

                    {/* Avantatar Upload Section */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative group">
                            <div className="size-32 rounded-full bg-surface-highlight border-4 border-surface-dark flex items-center justify-center overflow-hidden shadow-2xl relative">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-primary text-4xl font-bold">
                                        {full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                )}
                            </div>

                            {/* Camera Icon Overlay */}
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-0 right-0 p-2 bg-primary hover:bg-[#0fd650] text-background-dark rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95 border-2 border-background-dark cursor-pointer group-hover:block"
                                title="Alterar foto"
                                type="button"
                            >
                                <span className="material-symbols-outlined text-[20px]">photo_camera</span>
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleAvatarUpload}
                            />
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-white mb-1">{full_name || 'Seu Nome'}</h3>
                            <p className="text-text-secondary text-sm">{email}</p>
                        </div>
                    </div>

                    <form onSubmit={handleUpdateProfile} className="flex flex-col gap-6 mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Nome Completo */}
                            <label className="flex flex-col gap-2">
                                <span className="text-sm font-bold text-gray-300">Nome Completo</span>
                                <input
                                    type="text"
                                    value={full_name}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="bg-background-dark/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                                    placeholder="Ex: Neto Duque"
                                />
                            </label>

                            {/* Cargo */}
                            <label className="flex flex-col gap-2">
                                <span className="text-sm font-bold text-gray-300">Cargo / Função</span>
                                <input
                                    type="text"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="bg-background-dark/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                                    placeholder="Ex: Gerente de Projetos"
                                />
                            </label>

                            {/* Email */}
                            <label className="flex flex-col gap-2 md:col-span-2">
                                <span className="text-sm font-bold text-gray-300">E-mail</span>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="bg-background-dark/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                                    placeholder="seu@email.com"
                                />
                                {(user as any)?.new_email && (
                                    <div className="mt-2 text-xs bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 p-3 rounded-lg flex items-start gap-2">
                                        <span className="material-symbols-outlined text-[16px] mt-0.5">info</span>
                                        <p>
                                            Alteração pendente para: <strong>{(user as any).new_email}</strong><br />
                                            Verifique sua caixa de entrada para confirmar.
                                        </p>
                                    </div>
                                )}
                            </label>
                        </div>

                        <div className="h-[1px] bg-white/5 my-2"></div>

                        {/* Senha */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <label className="flex flex-col gap-2">
                                <span className="text-sm font-bold text-gray-300">Nova Senha (Opcional)</span>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="bg-background-dark/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                                    placeholder="••••••••"
                                />
                            </label>

                            <label className="flex flex-col gap-2">
                                <span className="text-sm font-bold text-gray-300">Confirmar Senha</span>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="bg-background-dark/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                                    placeholder="••••••••"
                                />
                            </label>
                        </div>

                        <div className="flex justify-end mt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-[#22C55E] hover:bg-[#16a34a] text-black font-bold py-3 px-8 rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></span>
                                        Salvando...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined">save</span>
                                        Salvar Alterações
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
