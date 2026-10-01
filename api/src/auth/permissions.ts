// 身份組與權限判斷(D-143)。規則只定義在這裡一處,網站登入、每日比對、bot 指令共用。
//
// 規則字串:`,` = 或、`+` = 且,例如 `A,B,C`(任一個)、`A+B`(同時擁有)、`A+B,C`((A 且 B)或 C)。
// 概念上是 some(組 => 組.every(身份組 ID))。目前不支援「排除某身份組」與括號巢狀。
// 格式錯誤或規則為空時丟出錯誤,讓服務啟動失敗,不會默默變成所有人放行。

/** 規則的結構:外層 = 或,內層 = 且 */
export type RoleRule = readonly (readonly string[])[];

/** Discord 身份組 ID 是 snowflake:純數字,實際長度約 17~20 位 */
const SNOWFLAKE = /^\d{17,20}$/;

export class RoleRuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RoleRuleError';
  }
}

export function parseRoleRule(input: string | undefined | null): RoleRule {
  if (input === undefined || input === null || input.trim() === '') {
    throw new RoleRuleError('身份組規則不可為空');
  }
  return input.split(',').map((group, gi) => {
    const roles = group.split('+').map((r) => r.trim());
    for (const role of roles) {
      if (role === '') throw new RoleRuleError(`身份組規則含空白項目(第 ${gi + 1} 組):${JSON.stringify(input)}`);
      if (!SNOWFLAKE.test(role)) throw new RoleRuleError(`身份組 ID 格式錯誤:${JSON.stringify(role)}(應為 17~20 位數字)`);
    }
    return roles;
  });
}

export function matchesRoleRule(rule: RoleRule, memberRoleIds: Iterable<string>): boolean {
  const owned = new Set(memberRoleIds);
  return rule.some((group) => group.every((id) => owned.has(id)));
}

/**
 * 權限群組:
 * - `member`:有資格使用(網站、bot 成員指令)
 * - `admin`:管理員(沿用 Eranarch 現有管理員身份組設定,實作時讀 Eranarch 程式碼確認,D-143 ②⑦)
 * - `public`:不需權限
 * 兩者獨立,管理員不自動算有資格(D-143 ②)。
 */
export type PermissionGroup = 'member' | 'admin' | 'public';

export interface PermissionRules {
  member: RoleRule;
  /** 管理員規則來源尚待確認(Eranarch 既有設定),未提供時所有人都不算管理員 */
  admin?: RoleRule;
}

export interface Permissions {
  /** 用唯一的判斷函式檢查某成員是否屬於某權限群組 */
  can(group: PermissionGroup, memberRoleIds: Iterable<string>): boolean;
}

export function createPermissions(rules: PermissionRules): Permissions {
  return {
    can(group, memberRoleIds) {
      switch (group) {
        case 'public':
          return true;
        case 'member':
          return matchesRoleRule(rules.member, memberRoleIds);
        case 'admin':
          return rules.admin ? matchesRoleRule(rules.admin, memberRoleIds) : false;
      }
    },
  };
}

/** 從環境變數載入設定;規則為空或格式錯誤會丟出 RoleRuleError(啟動失敗) */
export function loadPermissionsFromEnv(env: NodeJS.ProcessEnv = process.env): Permissions {
  return createPermissions({ member: parseRoleRule(env.ELIGIBLE_ROLE_RULE) });
}
