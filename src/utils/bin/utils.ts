import packageJson from '../../../package.json';
import * as bin from './index';

export const help = async (args: string[]): Promise<string> => {
  const commands = Object.keys(bin).sort().join(', ');

  return `Available commands:\n${commands}\n\n[tab]\t trigger completion.\n[ctrl+l] clear terminal.\n[ctrl+c] cancel command.`;
};

export const whoami = async (args: string[]): Promise<string> => {
  return 'My guest :)';
};

export const my_projects = async (args: string[]): Promise<string> => {
  return `                                              
See them all here: Github: https://github.com/lootboi
*Categories coming soon*
`;
};

export const socials = async (args: string[]): Promise<string> => {
  return `                                              
Twitter: https://twitter.com/AltLoot
`;
};

// export const donate = async (args?: string[]): Promise<string> => {
//   window.open(packageJson.funding.url, '_blank');

//   return 'Opening donation url...';
// };

export const banner = (args?: string[]): string => {
  return `                                              
    / /                                                
   / /         ___      ___    __  ___  ___      __    
  / /        //   ) ) //   ) )  / /   //___) ) //  ) ) 
 / /        //   / / //   / /  / /   //       //       
/ /____/ / ((___/ / ((___/ /  / /   ((____   //       v1.0.0
------------------------------------------------------------
A collection of my personal projects, thoughts, and opinions
------------------------------------------------------------

*Type 'help' to see list of available commands.
*Try out the 'theme' command!
`;
};
